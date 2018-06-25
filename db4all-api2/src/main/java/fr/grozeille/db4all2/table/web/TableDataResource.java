package fr.grozeille.db4all2.table.web;

import com.erudika.para.client.ParaClient;
import fr.grozeille.db4all2.project.model.Project;
import fr.grozeille.db4all2.table.model.Table;
import fr.grozeille.db4all2.table.model.TableData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.*;

@RestController
@Slf4j
@RequestMapping("/api/project")
public class TableDataResource {

    public static final String TABLE_DATA_ID_SUFFIX = "-data";
    public static final String COL_ROW_ID = "#row_id#";

    @Autowired
    private ParaClient paraClient;

    @CrossOrigin
    @RequestMapping(value = "/{project}/table/{table}/data", method = RequestMethod.PUT)
    public ResponseEntity<Void> updateData(
            @PathVariable("project") String project,
            @PathVariable("table") String table,
            @RequestBody Map<String, Object>[] tableData) throws Exception {

        Project p = getProject(project);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        Table t = getTable(p, table);
        if (t == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        TableData data = paraClient.read(new TableData().getType(), t.getId()+ TABLE_DATA_ID_SUFFIX);
        if(data == null) {
            data = new TableData();
            data.setId(t.getId()+ TABLE_DATA_ID_SUFFIX);
            data.setParentid(t.getId());
            data.setVersion(1l);
            data.setTimestamp(System.currentTimeMillis());
            data.setUpdated(data.getTimestamp());
        }
        else {
            data.setVersion(data.getVersion()+1l);
            data.setUpdated(data.getTimestamp());
        }

        data.setData(Arrays.asList(tableData));

        // add an unique Row ID if not already set
        for(Map<String, Object> row : data.getData()) {
            if(!row.isEmpty()) {
                Object rowIdValue = row.get(COL_ROW_ID);
                if (rowIdValue == null) {
                    row.put(COL_ROW_ID, UUID.randomUUID().toString());
                }
            }
        }
        data = paraClient.create(data);

        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath().path("/api/project/{project}/table/{table}/data")
                .buildAndExpand(project, table).toUri();

        return ResponseEntity.created(location).build();
    }

    @CrossOrigin
    @RequestMapping(value = "/{project}/table/{table}/data", method = RequestMethod.GET)
    public ResponseEntity<List<Map<String, Object>>> getData(@PathVariable("project") String project,
                                                             @PathVariable("table") String table) throws Exception {
        Project p = getProject(project);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        Table t = getTable(p, table);
        if (t == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        TableData data = paraClient.read(new TableData().getType(), t.getId()+ TABLE_DATA_ID_SUFFIX);
        if(data == null) {
            data = new TableData();
            data.setData(new ArrayList<>());
        }

        return ResponseEntity.ok(data.getData());
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
