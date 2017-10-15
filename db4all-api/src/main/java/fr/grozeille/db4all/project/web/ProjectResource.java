package fr.grozeille.db4all.project.web;

import fr.grozeille.db4all.project.model.Project;
import fr.grozeille.db4all.project.repositories.ProjectRepository;
import fr.grozeille.db4all.project.web.dto.ProjectCreationRequest;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;

@RestController
@Slf4j
@RequestMapping("/api/project")
public class ProjectResource {

    @Autowired
    private ProjectRepository projectRepository;

    @ApiImplicitParams({
            @ApiImplicitParam(name = "page", dataType = "integer", paramType = "query",
                    value = "Results page you want to retrieve (0..N)"),
            @ApiImplicitParam(name = "size", dataType = "integer", paramType = "query",
                    value = "Number of records per page."),
            @ApiImplicitParam(name = "sort", allowMultiple = true, dataType = "string", paramType = "query",
                    value = "Sorting criteria in the format: property(,asc|desc). " +
                            "Default sort order is ascending. " +
                            "Multiple sort criteria are supported.")
    })
    @RequestMapping(value = "", method = RequestMethod.GET)
    public Page<Project> filter(
            Pageable pageable,
            @RequestParam(value = "filter", required = false, defaultValue = "") String filter) throws IOException {

        return projectRepository.findAll(pageable, filter);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ResponseEntity<Project> get(@PathVariable("id") String id) {
        Project result = this.projectRepository.findOne(id);
        if(result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        return ResponseEntity.ok(result);
    }

    @RequestMapping(value = "", method = RequestMethod.POST)
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Project> create(@RequestBody ProjectCreationRequest request) throws Exception {
        Project project = this.projectRepository.save(new Project(
                null,
                request.getName(),
                request.getComment(),
                request.getTags(),
                Arrays.asList(new String[0])
        ));

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/api/project/{id}")
                .buildAndExpand(project.getId()).toUri();

        return ResponseEntity.created(location).body(project);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.PUT)
    public ResponseEntity<Project> update(@PathVariable("id") String id, @RequestBody Project project) throws Exception {

        if(!project.getId().equals(id)){
            return ResponseEntity.badRequest().body(null);
        }

        Project result = this.projectRepository.findOne(id);
        if(result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        projectRepository.save(project);

        return ResponseEntity.ok().body(project);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.DELETE)
    public void delete(@PathVariable("id") String id) {
        this.projectRepository.delete(id);
    }

}
