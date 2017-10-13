package fr.grozeille.db4all.entity.services;


import fr.grozeille.db4all.entity.model.Entity;
import fr.grozeille.db4all.entity.model.EntitySearchItem;
import fr.grozeille.db4all.entity.repositories.EntityRepository;
import fr.grozeille.db4all.entity.repositories.EntitySearchItemRepository;
import fr.grozeille.db4all.project.model.Project;
import fr.grozeille.db4all.project.repositories.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class EntityService {

    @Autowired
    private EntitySearchItemRepository entitySearchItemRepository;

    @Autowired
    private EntityRepository entityRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public Page<Entity> findAll(Pageable pageable, String filter, String project) throws IOException {
        if(pageable.getSort() == null) {
            pageable = new PageRequest(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    new Sort(Sort.Direction.ASC, "projectName", "name"));
        }

        Page<EntitySearchItem> result;
        result = entitySearchItemRepository.findAllAndProject(pageable, filter, "");

        Map<String, Entity> entitiesById = new HashMap<>();

        Iterable<Entity> entities = entityRepository.findAll(result.map(searchItem -> searchItem.getId()));
        entities.forEach(e -> {
            if(e != null) {
                entitiesById.put(e.getId(), e);
            }
        });

        return result.map(searchItem -> entitiesById.get(searchItem.getId()));
    }

    public Entity create(String projectId, Entity entity) throws Exception {

        Project project = projectRepository.findOne(projectId);
        // TODO if not found

        entity.setId(UUID.randomUUID().toString());

        entityRepository.save(projectId, entity);

        EntitySearchItem searchItem = toEntitySearchItem(project, entity);

        entitySearchItemRepository.save(searchItem);

        return entity;
    }

    public void update(String project, Entity entity) throws Exception {

        entityRepository.save(project, entity);

        Project projectItem = projectRepository.findOne(project);

        EntitySearchItem searchItem = toEntitySearchItem(projectItem, entity);

        entitySearchItemRepository.save(searchItem);
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

    public void delete(String projectId, String entityId) {
        entityRepository.delete(projectId, entityId);
        entitySearchItemRepository.delete(entityId);
    }
}
