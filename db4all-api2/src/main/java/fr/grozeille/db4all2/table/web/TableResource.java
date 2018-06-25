package fr.grozeille.db4all2.table.web;

import com.erudika.para.client.ParaClient;
import com.erudika.para.core.ParaObject;
import com.erudika.para.utils.Pager;
import fr.grozeille.db4all2.ClusterConfiguration;
import fr.grozeille.db4all2.project.model.Project;
import fr.grozeille.db4all2.table.model.Table;
import fr.grozeille.db4all2.table.web.dto.TableCreationRequest;
import fr.grozeille.db4all2.table.web.dto.TableUpdateRequest;
import fr.grozeille.db4all2.utils.PageResult;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@RestController
@Slf4j
@RequestMapping("/api/project")
public class TableResource {

    @Autowired
    private ParaClient paraClient;


    @CrossOrigin
    @RequestMapping(value = "/{project}/table", method = RequestMethod.POST)
    public ResponseEntity<Void> create(
            @PathVariable("project") String project,
            @RequestBody TableCreationRequest request) throws Exception {

        Project p = getProject(project);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }

        Table t = new Table();
        t.setParentid(p.getId());
        t.setTimestamp(System.currentTimeMillis());
        t.setUpdated(t.getTimestamp());
        t.setVersion(1l);
        t.setName(request.getName());
        t = paraClient.create(t);

        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath().path("/api/project/{project}/table/{table}")
                .buildAndExpand(project, t.getId()).toUri();

        return ResponseEntity.created(location).build();
    }

    @CrossOrigin
    @RequestMapping(value = "/{project}/table/{table}", method = RequestMethod.PUT)
    public ResponseEntity<Void> update(
            @PathVariable("project") String project,
            @PathVariable("table") String table,
            @RequestBody TableUpdateRequest request) throws Exception {

        Project p = getProject(project);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        Table t = getTable(p, table);
        if (t == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        t.setId(table);
        t.setParentid(p.getId());
        t.setUpdated(System.currentTimeMillis());
        t.setVersion(t.getVersion()+1l);
        t.setName(request.getName());
        t.setComment(request.getComment());
        t.setTags(Arrays.asList(request.getTags()));
        t.setFields(request.getFields());
        t.setFilters(request.getFilters());
        t.setLastFilter(request.getLastFilter());

        t = paraClient.create(t);

        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath().path("/api/project/{project}/table/{table}")
                .buildAndExpand(project, t.getId()).toUri();

        return ResponseEntity.created(location).build();
    }


    @CrossOrigin
    @RequestMapping(value = "/{project}/table/{table}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> delete(
            @PathVariable("project") String project,
            @PathVariable("table") String table) throws Exception {

        Project p = getProject(project);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        Table t = getTable(p, table);
        if (t == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        paraClient.delete(t);

        return ResponseEntity.ok().build();
    }

    @CrossOrigin
    @RequestMapping(value = "/{project}/table", method = RequestMethod.GET)
    public ResponseEntity<PageResult<Table>> filter(
            @PathVariable("project") String project,
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "100") Integer size,
            @RequestParam(value = "filter", required = false, defaultValue = "*") String filter) throws IOException {

        Project p = getProject(project);
        if (p == null) {
            PageResult pageResult = new PageResult();
            pageResult.setFirst(true);
            pageResult.setLast(true);
            pageResult.setTotalElements(0l);
            pageResult.setTotalPages(0);
            pageResult.setContent(new ArrayList<>());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pageResult);
        }

        Pager pager = new Pager(page, size);
        List<Table> result = paraClient.findChildren(p, new Table().getType(), filter, pager);

        PageResult pageResult = new PageResult();
        pageResult.setContent(result);
        pageResult.setTotalElements(pager.getCount());

        Integer totalPages = (int)Math.ceil(pager.getCount() / new Double(size));
        pageResult.setTotalPages(totalPages);
        pageResult.setFirst(page == 0);
        pageResult.setLast(totalPages.equals(page + 1));

        return ResponseEntity.ok().body(pageResult);
    }

    @CrossOrigin
    @RequestMapping(value = "/{project}/table/{table}", method = RequestMethod.GET)
    public ResponseEntity<Table> get(@PathVariable("project") String project,
                                      @PathVariable("table") String table) throws IOException {

        Project p = getProject(project);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        Table t = getTable(p, table);
        if (t == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        return ResponseEntity.ok(t);
    }

    private Table getTable(Project project, String table) {
        Table t = paraClient.read(new Table().getType(), table);
        if(!project.getId().equals(t.getParentid())) {
            log.warn("Table found but with parent project "+t.getParentid()+" instead of "+project.getId());
            return null;
        }

        return t;
    }

    private Project getProject(String project) {
        return paraClient.read(new Project().getType(), project);
    }
}
