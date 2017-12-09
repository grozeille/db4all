package fr.grozeille.db4all.entity.web;

import com.google.common.base.Strings;
import fr.grozeille.db4all.entity.model.Entity;
import fr.grozeille.db4all.entity.model.EntityData;
import fr.grozeille.db4all.entity.model.EntityField;
import fr.grozeille.db4all.entity.repositories.EntityDataRepository;
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
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@Slf4j
@RequestMapping("/api/project")
public class EntityResource {

    @Autowired
    private EntityRepository entityRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EntityDataRepository entityDataRepository;

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
    @RequestMapping(value = "/{project}/entity", method = RequestMethod.GET)
    public Page<Entity> filter(
            Pageable pageable,
            @PathVariable("project") String project,
            @RequestParam(value = "filter", required = false, defaultValue = "") String filter) throws IOException {

        return entityRepository.findAllByProject(pageable, filter, project);
    }

    @RequestMapping(value = "/{project}/entity/{entity}", method = RequestMethod.GET)
    public ResponseEntity<Entity> get(@PathVariable("project") String project,
                                      @PathVariable("entity") String entity) throws IOException {
        Entity result = entityRepository.findOne(project, entity);
        return ResponseEntity.ok(result);
    }

    @RequestMapping(value = "/{project}/entity", method = RequestMethod.POST)
    public ResponseEntity<Entity> create(
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
                request.getTags(),
                request.getFields(),
                request.getFilters(),
                request.getLastFilter()));

        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath().path("/api/project/{project}/entity/{entity}")
                .buildAndExpand(project, createdEntity.getId()).toUri();

        return ResponseEntity.created(location).body(createdEntity);
    }

    @RequestMapping(value = "/{project}/entity/{entity}", method = RequestMethod.PUT)
    public ResponseEntity<Entity> update(
            @PathVariable("project") String project,
            @PathVariable("entity") String entity,
            @RequestBody Entity entityItem) throws Exception {

        if(!entity.equals(entityItem.getId())){
            return ResponseEntity.badRequest().body(null);
        }

        if (checkEntityExists(project, entity)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        entityItem = entityRepository.save(project, entityItem);

        return ResponseEntity.ok().body(entityItem);
    }

    @RequestMapping(value = "/{project}/entity/{entity}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> delete(
            @PathVariable("project") String project,
            @PathVariable("entity") String entity) throws Exception {

        if (checkEntityExists(project, entity)) {
            return ResponseEntity.notFound().build();
        }

        entityRepository.delete(project, entity);
        entityDataRepository.delete(project, entity);

        return ResponseEntity.ok().build();
    }

    @RequestMapping(value = "/{project}/entity/{entity}/data", method = RequestMethod.PUT)
    public ResponseEntity<Void> updateData(
            @PathVariable("project") String project,
            @PathVariable("entity") String entity,
            @RequestBody Map<String, Object>[] entityData) throws Exception {

        if (checkEntityExists(project, entity)) {
            return ResponseEntity.notFound().build();
        }

        entityDataRepository.save(project, entity, new EntityData(Arrays.asList(entityData)));

        return ResponseEntity.ok().body(null);
    }

    @RequestMapping(value = "/{project}/entity/{entity}/data", method = RequestMethod.GET)
    public ResponseEntity<List<Map<String, Object>>> getData(@PathVariable("project") String project,
                                                             @PathVariable("entity") String entity) throws Exception {
        if (checkEntityExists(project, entity)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        EntityData entityData = entityDataRepository.findOne(project, entity);

        return ResponseEntity.ok(entityData.getData());
    }

    private boolean checkEntityExists(String project, String entity) {
        Entity result = entityRepository.findOne(project, entity);
        if(result == null){
            return true;
        }
        return false;
    }
}
