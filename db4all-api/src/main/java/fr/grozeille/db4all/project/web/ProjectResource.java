package fr.grozeille.db4all.project.web;

import fr.grozeille.db4all.project.model.Project;
import fr.grozeille.db4all.project.repositories.ProjectRepository;
import fr.grozeille.db4all.project.web.dto.NewProjectRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/project")
public class ProjectResource {

    @Autowired
    private ProjectRepository projectRepository;

    @RequestMapping(value = "", method = RequestMethod.GET)
    public Iterable<Project> getAll() {
        return this.projectRepository.findAll();
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public Project get(@PathVariable("id") String id) {
        return this.projectRepository.findOne(id);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.PUT)
    public ResponseEntity<Void> put(@PathVariable("id") String id, @RequestBody Project project) {
        this.projectRepository.save(project);

        return ResponseEntity.ok().build();
    }

    @RequestMapping(value = "", method = RequestMethod.POST)
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<Void> add(@RequestBody NewProjectRequest request) {
        Project project = new Project();
        project.setId(UUID.randomUUID().toString());
        project.setName(request.getName());
        project.setHiveDatabase(request.getHiveDatabase());
        project.setHdfsWorkingDirectory(request.getHdfsWorkingDirectory());
        project = this.projectRepository.save(project);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(project.getId()).toUri();

        return ResponseEntity.created(location).build();
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.DELETE)
    public void delete(@PathVariable("id") String id) {
        this.projectRepository.delete(id);
    }

}
