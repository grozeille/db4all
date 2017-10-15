package fr.grozeille.db4all.entity.repositories;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.google.common.base.Strings;
import com.google.common.collect.Lists;
import fr.grozeille.db4all.entity.model.Entity;
import fr.grozeille.db4all.entity.model.EntitySearchItem;
import fr.grozeille.db4all.project.model.Project;
import fr.grozeille.db4all.project.model.ProjectSearchItem;
import fr.grozeille.db4all.project.repositories.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.client.Get;
import org.apache.hadoop.hbase.client.Result;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.data.solr.repository.SolrCrudRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class EntityRepository {
    @Autowired
    private HbaseTemplate hbaseTemplate;

    @Autowired
    private EntitySearchItemRepository entitySearchItemRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private final ObjectMapper objectMapper;

    private final String tableName = "projects";

    private final String cfEntities = "cfEntities";

    public EntityRepository(){
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public Entity findOne(String project, String id) {
        return hbaseTemplate.get(tableName, project, cfEntities, id, (r, n) -> map(r));
    }

    public Entity save(String projectId, Entity entity) throws Exception {
        Project project = projectRepository.findOne(projectId);

        if(Strings.isNullOrEmpty(entity.getId())){
            entity.setId(UUID.randomUUID().toString());
        }
        byte[] data = objectMapper.writeValueAsBytes(entity);
        hbaseTemplate.put(tableName, projectId, cfEntities, entity.getId(), data);

        EntitySearchItem searchItem = toEntitySearchItem(project, entity);

        this.entitySearchItemRepository.save(searchItem);

        return entity;
    }

    public void delete(String projectId, String id) {
        hbaseTemplate.delete(tableName, projectId, cfEntities, id);
        this.entitySearchItemRepository.delete(id);
    }

    public Iterable<Entity> findAll(Iterable<String> ids) throws IOException {
        return hbaseTemplate.execute(tableName, table -> {
            List<Get> queryRowList = new ArrayList<>();
            for(String id : ids) {
                queryRowList.add(new Get(Bytes.toBytes(id)));
            }
            Result[] results = table.get(queryRowList);
            return Arrays.stream(results).map(result -> map(result))::iterator;
        });
    }

    public Page<Entity> findAll(Pageable pageable, String filter) throws IOException {
        pageable = getOrDefaultPageable(pageable);

        Page<EntitySearchItem> result = this.entitySearchItemRepository.findAll(pageable, filter);
        List<String> id = new ArrayList<>();
        for(EntitySearchItem i : result){
            id.add(i.getId());
        }
        Iterable<Entity> all = this.findAll(id);
        return new PageImpl<>(Lists.newArrayList(all.iterator()), pageable, result.getTotalElements());
    }

    public Page<Entity> findAllByProject(Pageable pageable, String filter, String projectId) throws IOException {
        pageable = getOrDefaultPageable(pageable);

        Page<EntitySearchItem> result = this.entitySearchItemRepository.findAllByProject(pageable, filter, projectId);
        List<String> id = new ArrayList<>();
        for(EntitySearchItem i : result){
            id.add(i.getId());
        }
        Iterable<Entity> all = this.findAll(id);
        return new PageImpl<>(Lists.newArrayList(all.iterator()), pageable, result.getTotalElements());
    }

    private Entity map(Result result){
        try {
            return result.value() == null ? null : (Entity)objectMapper.readValue(result.value(), Entity.class);
        } catch (IOException e) {
            log.error("Unable to read JSON for "+new String(result.getRow()));
            return null;
        }
    }

    private EntitySearchItem toEntitySearchItem(Project project, Entity entity) {
        EntitySearchItem searchItem = new EntitySearchItem();
        searchItem.setId(entity.getId());
        searchItem.setName(entity.getName());
        searchItem.setComment(entity.getComment());
        searchItem.setTags(entity.getTags());
        searchItem.setProjectName(project.getName());
        return searchItem;
    }

    private Pageable getOrDefaultPageable(Pageable pageable) {
        if(pageable.getSort() == null) {
            pageable = new PageRequest(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    new Sort(Sort.Direction.ASC, "projectName", "name"));
        }
        return pageable;
    }
}
