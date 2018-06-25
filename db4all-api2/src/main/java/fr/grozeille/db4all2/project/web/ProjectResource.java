package fr.grozeille.db4all2.project.web;

import com.erudika.para.client.ParaClient;
import com.erudika.para.utils.Pager;
import fr.grozeille.db4all2.project.model.Project;
import fr.grozeille.db4all2.project.web.dto.ProjectCreationRequest;
import fr.grozeille.db4all2.project.web.dto.ProjectUpdateRequest;
import fr.grozeille.db4all2.table.model.Table;
import fr.grozeille.db4all2.utils.PageResult;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.ws.rs.core.MultivaluedMap;
import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@Slf4j
@RequestMapping("/api/project")
public class ProjectResource {


    @Autowired
    private ParaClient paraClient;

    @CrossOrigin
    @RequestMapping(value = "", method = RequestMethod.GET)
    public PageResult<Project> filter(
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "100") Integer size,
            @RequestParam(value = "filter", required = false, defaultValue = "*") String filter) throws IOException {

        Pager pager = new Pager(page, size);
        List<Project> result = paraClient.findQuery(new Project().getType(), filter, pager);

        PageResult pageResult = new PageResult();
        pageResult.setContent(result);
        pageResult.setTotalElements(pager.getCount());

        Integer totalPages = (int)Math.ceil(pager.getCount() / new Double(size));
        pageResult.setTotalPages(totalPages);
        pageResult.setFirst(page == 0);
        pageResult.setLast(totalPages.equals(page + 1));

        return pageResult;
    }

    @CrossOrigin
    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ResponseEntity<Project> get(@PathVariable("id") String id) {
        Project p = getProject(id);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        return ResponseEntity.ok(p);
    }

    @CrossOrigin
    @RequestMapping(value = "", method = RequestMethod.POST)
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Void> create(@RequestBody ProjectCreationRequest request) throws Exception {
        Project p = new Project();
        p.setTimestamp(System.currentTimeMillis());
        p.setVersion(1l);
        p.setName(request.getName());
        p = paraClient.create(p);

        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath().path("/api/project/{project}")
                .buildAndExpand(p.getId()).toUri();

        return ResponseEntity.created(location).build();
    }

    @CrossOrigin
    @RequestMapping(value = "/{id}", method = RequestMethod.PUT)
    public ResponseEntity<Void> update(
            @PathVariable("id") String id,
            @RequestBody ProjectUpdateRequest request) throws Exception {

        Project p = getProject(id);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }

        p.setId(id);
        p.setTimestamp(System.currentTimeMillis());
        p.setVersion(p.getVersion()+1l);
        p.setName(request.getName());
        p.setComment(request.getComment());
        p.setTags(Arrays.asList(request.getTags()));

        p = paraClient.create(p);

        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath().path("/api/project/{project}")
                .buildAndExpand(p.getId()).toUri();

        return ResponseEntity.created(location).build();
    }

    @CrossOrigin
    @RequestMapping(value = "/{id}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        Project p = getProject(id);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }

        paraClient.delete(p);

        return ResponseEntity.ok().build();
    }

    private Project getProject(String project) {
        return paraClient.read(new Project().getType(), project);
    }
}