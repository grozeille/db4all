package fr.grozeille.db4all.project.repositories;

import com.google.common.base.Strings;
import com.google.common.collect.Lists;
import fr.grozeille.db4all.configurations.HBaseWithSolrJsonDataRepository;
import fr.grozeille.db4all.entity.repositories.EntitySearchItemRepository;
import fr.grozeille.db4all.project.model.Project;
import fr.grozeille.db4all.project.model.ProjectSearchItem;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.IteratorUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Component;

import java.beans.IntrospectionException;
import java.io.IOException;
import java.io.InvalidClassException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
public class ProjectRepository extends HBaseWithSolrJsonDataRepository<Project, ProjectSearchItem> {

    private final ProjectSearchItemRepository projectSearchItemRepository;

    private final EntitySearchItemRepository entitySearchItemRepository;

    @Autowired
    public ProjectRepository(ProjectSearchItemRepository projectSearchItemRepository, EntitySearchItemRepository entitySearchItemRepository) throws IntrospectionException, InvalidClassException {
        super(Project.class, "projects", new String[]{ "cfEntities" }, projectSearchItemRepository, ProjectSearchItem.class);
        this.projectSearchItemRepository = projectSearchItemRepository;
        this.entitySearchItemRepository = entitySearchItemRepository;
    }

    @Override
    public Page<Project> findAll(Pageable pageable) {
        pageable = getOrDefaultPageable(pageable);
        return super.findAll(pageable);
    }

    public Page<Project> findAll(Pageable pageable, String filter) throws IOException {
        pageable = getOrDefaultPageable(pageable);

        if(Strings.isNullOrEmpty(filter)){
            return this.findAll(pageable);
        }
        else {
            Page<ProjectSearchItem> result = this.projectSearchItemRepository.findAll(pageable, filter);
            List<String> id = new ArrayList<>();
            for(ProjectSearchItem i : result){
                id.add(i.getId());
            }
            Iterable<Project> all = this.findAll(id);
            return new PageImpl<>(Lists.newArrayList(all.iterator()), pageable, result.getTotalElements());
        }
    }

    @Override
    public void deleteAll() {
        super.deleteAll();
        entitySearchItemRepository.deleteAll();
    }

    @Override
    protected ProjectSearchItem toSearchItem(Project project) {
        ProjectSearchItem searchItem = new ProjectSearchItem();
        searchItem.setId(project.getId());
        searchItem.setName(project.getName());
        searchItem.setComment(project.getComment());
        searchItem.setTags(project.getTags());
        return searchItem;
    }

    private Pageable getOrDefaultPageable(Pageable pageable) {
        if(pageable.getSort() == null) {
            pageable = new PageRequest(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    new Sort(Sort.Direction.ASC, "name"));
        }
        return pageable;
    }

}
