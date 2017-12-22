package fr.grozeille.db4all.entity.repositories;


import com.fasterxml.jackson.databind.DeserializationFeature;
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
import org.apache.hadoop.hbase.*;
import org.apache.hadoop.hbase.client.Get;
import org.apache.hadoop.hbase.client.HBaseAdmin;
import org.apache.hadoop.hbase.client.Result;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.data.solr.repository.SolrCrudRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.*;

@Slf4j
@Component
public class EntityRepository {
    @Autowired
    private HbaseTemplate hbaseTemplate;

    @Autowired
    private HBaseAdmin hbaseAdmin;

    @Autowired
    private EntitySearchItemRepository entitySearchItemRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private final ObjectMapper objectMapper;

    private final String tableName = "projects";

    private final String cfEntities = "cfEntities";

    private final String cfData = "cfData";

    public EntityRepository(){
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public Entity findOne(String project, String id) {
        return hbaseTemplate.get(tableName, project, cfEntities, id, (r, n) -> map(r, id));
    }

    public Entity save(String projectId, Entity entity) throws Exception {
        Project project = projectRepository.findOne(projectId);

        boolean isNew = false;

        if(Strings.isNullOrEmpty(entity.getId())){
            entity.setId(UUID.randomUUID().toString());
            isNew = true;
        }
        byte[] data = objectMapper.writeValueAsBytes(entity);
        hbaseTemplate.put(tableName, projectId, cfEntities, entity.getId(), data);

        EntitySearchItem searchItem = toEntitySearchItem(project, entity);

        this.entitySearchItemRepository.save(searchItem);

        if(isNew) {
            createTable(projectId, entity.getId());
        }

        return entity;
    }

    public void delete(String projectId, String id) {
        hbaseTemplate.delete(tableName, projectId, cfEntities, id);
        this.entitySearchItemRepository.delete(id);
    }

    public Iterable<Entity> findAll(String projectId, Iterable<String> ids) throws IOException {
        return hbaseTemplate.execute(tableName, table -> {
            Get get = new Get(Bytes.toBytes(projectId));
            for(String id : ids) {
                get.addColumn(Bytes.toBytes(cfEntities), Bytes.toBytes(id));
            }
            Result result = table.get(get);
            return map(result, ids);
        });
    }

    public Page<Entity> findAll(Pageable pageable, String filter) throws IOException {
        pageable = getOrDefaultPageable(pageable);

        Page<EntitySearchItem> result;

        if(Strings.isNullOrEmpty(filter)){
            result = this.entitySearchItemRepository.findAll(pageable);
        }
        else {
            result = this.entitySearchItemRepository.findAll(pageable, filter);
        }

        Map<String, Entity> entitiesMap = new HashMap<>();
        Map<String, List<String>> entitiesByProject = new HashMap<>();
        for(EntitySearchItem i : result){
            entitiesMap.put(i.getProjectId()+'#'+ i.getId(), null);
            List<String> entities;
            if(!entitiesByProject.containsKey(i.getProjectId())){
                entities = new ArrayList<>();
                entitiesByProject.put(i.getProjectId(), entities);
            }
            else {
                entities = entitiesByProject.get(i.getProjectId());
            }
            entities.add(i.getId());
        }

        for(String p : entitiesByProject.keySet()){
            Iterable<Entity> projectResult = this.findAll(p, entitiesByProject.get(p));
            for(Entity e : projectResult){
                entitiesMap.put(p+'#'+ e.getId(), e);
            }
        }
        List<Entity> entityResult = new ArrayList<>();
        for(Map.Entry<String, Entity> entry : entitiesMap.entrySet()){
            entityResult.add(entry.getValue());
        }
        return new PageImpl<>(entityResult, pageable, result.getTotalElements());
    }

    public Page<Entity> findAllByProject(Pageable pageable, String filter, String projectId) throws IOException {
        pageable = getOrDefaultPageable(pageable);

        Page<EntitySearchItem> result;
        if(Strings.isNullOrEmpty(filter)){
            result = this.entitySearchItemRepository.findAllByProject(pageable, projectId);
        }
        else {
            result = this.entitySearchItemRepository.findAllByProject(pageable, filter, projectId);
        }

        List<String> id = new ArrayList<>();
        for(EntitySearchItem i : result){
            id.add(i.getId());
        }
        Iterable<Entity> all = this.findAll(projectId, id);
        return new PageImpl<>(Lists.newArrayList(all.iterator()), pageable, result.getTotalElements());
    }

    private Entity map(Result result, String id){
        try {
            byte[] value = result.getValue(Bytes.toBytes(cfEntities), Bytes.toBytes(id));
            return value == null ? null : (Entity)objectMapper.readValue(value, Entity.class);
        } catch (IOException e) {
            log.error("Unable to read JSON for "+new String(result.getRow()), e);
            return null;
        }
    }

    private Iterable<Entity> map(Result result, Iterable<String> ids){
        List<Entity> entities = new ArrayList<>();
        for(String id : ids){
            entities.add(map(result, id));
        }
        return entities;
    }

    private EntitySearchItem toEntitySearchItem(Project project, Entity entity) {
        EntitySearchItem searchItem = new EntitySearchItem();
        searchItem.setId(entity.getId());
        searchItem.setName(entity.getName());
        searchItem.setComment(entity.getComment());
        searchItem.setTags(entity.getTags());
        searchItem.setProjectName(project.getName());
        searchItem.setProjectId(project.getId());
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

    private void createTable(String projectId, String entityId) throws IOException {
        String name = projectId + "_" + entityId;
        try {
            hbaseAdmin.getTableDescriptor(TableName.valueOf(name));
        }catch (TableNotFoundException nf) {
            log.info("Table "+name+" not found, creating it...");
            HTableDescriptor tableDescriptor = new HTableDescriptor(TableName.valueOf(name));
            HColumnDescriptor hColumnDescriptor = new HColumnDescriptor(cfData);
            //hColumnDescriptor.setCompressionType(Compression.Algorithm.GZ);
            tableDescriptor.addFamily(hColumnDescriptor);
            hbaseAdmin.createTable(tableDescriptor);
        }
        String meta = name + "_meta";
        try {
            hbaseAdmin.getTableDescriptor(TableName.valueOf(meta));
        }catch (TableNotFoundException nf) {
            log.info("Table "+meta+" not found, creating it...");
            HTableDescriptor tableDescriptor = new HTableDescriptor(TableName.valueOf(meta));
            HColumnDescriptor hColumnDescriptor = new HColumnDescriptor(cfData);
            //hColumnDescriptor.setCompressionType(Compression.Algorithm.GZ);
            tableDescriptor.addFamily(hColumnDescriptor);
            hbaseAdmin.createTable(tableDescriptor);
        }
    }
}
