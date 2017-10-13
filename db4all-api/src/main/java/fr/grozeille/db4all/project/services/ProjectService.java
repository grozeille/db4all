package fr.grozeille.db4all.project.services;


import com.google.common.base.Strings;
import fr.grozeille.db4all.project.model.Project;
import fr.grozeille.db4all.project.model.ProjectSearchItem;
import fr.grozeille.db4all.project.repositories.ProjectRepository;
import fr.grozeille.db4all.project.repositories.ProjectSearchItemRepository;
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
public class ProjectService {

    @Autowired
    private ProjectSearchItemRepository projectSearchItemRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public Page<Project> findAll(Pageable pageable, String filter, String project) throws IOException {
        if(pageable.getSort() == null) {
            pageable = new PageRequest(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    new Sort(Sort.Direction.ASC, "name"));
        }

        Page<ProjectSearchItem> result;
        if(Strings.isNullOrEmpty(filter)){
            result = projectSearchItemRepository.findAll(pageable);
        }
        else {
            result = projectSearchItemRepository.findAll(pageable, filter);
        }

        Map<String, Project> projectById = new HashMap<>();

        Iterable<Project> projects = projectRepository.findAll(result.map(searchItem -> searchItem.getId()));
        projects.forEach(p -> {
            if(p != null) {
                projectById.put(p.getId(), p);
            }
        });

        return result.map(searchItem -> projectById.get(searchItem.getId()));
    }

    public Project create(Project project) throws Exception {

        project.setId(UUID.randomUUID().toString());

        projectRepository.save(project);

        ProjectSearchItem searchItem = toProjectSearchItem(project);

        projectSearchItemRepository.save(searchItem);

        return project;
    }

    public void update(Project project) throws Exception {
        projectRepository.save(project);

        ProjectSearchItem searchItem = toProjectSearchItem(project);

        projectSearchItemRepository.save(searchItem);
    }

    public void delete(String projectId) {
        projectRepository.delete(projectId);
        projectSearchItemRepository.delete(projectId);
    }

    private ProjectSearchItem toProjectSearchItem(Project project) {
        ProjectSearchItem searchItem = new ProjectSearchItem();
        searchItem.setId(project.getId());
        searchItem.setName(project.getName());
        searchItem.setComment(project.getComment());
        searchItem.setTags(project.getTags());
        return searchItem;
    }

}
