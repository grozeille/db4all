package fr.grozeille.db4all.entity.web;

import com.google.common.base.Strings;
import fr.grozeille.db4all.entity.model.Entity;
import fr.grozeille.db4all.entity.repositories.EntityRepository;
import fr.grozeille.db4all.entity.web.dto.EntityCreationRequest;
import fr.grozeille.db4all.project.model.Project;
import fr.grozeille.db4all.project.repositories.ProjectRepository;
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

@RestController
@Slf4j
@RequestMapping("/api/entity")
public class EntityResource {

    @Autowired
    private EntityRepository entityRepository;

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
    public Page<Entity> filter(
            Pageable pageable,
            @RequestParam(value = "filter", required = false, defaultValue = "") String filter) throws IOException {

        return entityRepository.findAll(pageable, filter);
    }

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
    @RequestMapping(value = "/{project}", method = RequestMethod.GET)
    public Page<Entity> filter(
            Pageable pageable,
            @PathVariable("project") String project,
            @RequestParam(value = "filter", required = false, defaultValue = "") String filter) throws IOException {

        return entityRepository.findAllByProject(pageable, filter, project);
    }

    @RequestMapping(value = "/{project}/{entity}", method = RequestMethod.GET)
    public ResponseEntity<Entity> get(@PathVariable("project") String project,
                                      @PathVariable("entity") String entity) throws IOException {
        Entity result = entityRepository.findOne(project, entity);
        return ResponseEntity.ok(result);
    }

    @RequestMapping(value = "/{project}", method = RequestMethod.POST)
    public ResponseEntity<?> create(
            @PathVariable("project") String project,
            @RequestBody EntityCreationRequest request) throws Exception {

        Project result = this.projectRepository.findOne(project);
        if(result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Entity createdEntity = entityRepository.save(project, new Entity(
                null,
                request.getName(),
                request.getComment(),
                request.getTags()));

        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath().path("/api/entity/{project}/{entity}")
                .buildAndExpand(project, createdEntity.getId()).toUri();

        return ResponseEntity.created(location).build();
    }

    @RequestMapping(value = "/{project}/{entity}", method = RequestMethod.PUT)
    public ResponseEntity<Void> update(
            @PathVariable("project") String project,
            @PathVariable("entity") String entity,
            @RequestBody Entity entityItem) throws Exception {

        if(!entity.equals(entityItem.getId())){
            return ResponseEntity.badRequest().build();
        }

        if (checkEntityExists(project, entity)) {
            return ResponseEntity.notFound().build();
        }

        entityRepository.save(project, entityItem);

        return ResponseEntity.ok().build();
    }

    @RequestMapping(value = "/{project}/{entity}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> delete(
            @PathVariable("project") String project,
            @PathVariable("entity") String entity) throws Exception {

        if (checkEntityExists(project, entity)) {
            return ResponseEntity.notFound().build();
        }

        entityRepository.delete(project, entity);

        return ResponseEntity.ok().build();
    }

    private boolean checkEntityExists(String project, String entity) {
        Entity result = entityRepository.findOne(project, entity);
        if(result == null){
            return true;
        }
        return false;
    }
}
