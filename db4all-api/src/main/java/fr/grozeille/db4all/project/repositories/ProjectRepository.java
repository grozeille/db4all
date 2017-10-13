package fr.grozeille.db4all.project.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.grozeille.db4all.project.model.Project;
import fr.grozeille.db4all.user.model.User;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.client.Get;
import org.apache.hadoop.hbase.client.HTable;
import org.apache.hadoop.hbase.client.HTableInterface;
import org.apache.hadoop.hbase.client.Result;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
public class ProjectRepository {
    @Autowired
    private HbaseTemplate hbaseTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String tableName = "projects";

    private final String cfInfo = "cfInfo";

    private final String colData = "data";

    public Project findOne(String id) {
        return hbaseTemplate.get(tableName, id, cfInfo, colData, (r,n) -> r.value() == null ? null : objectMapper.readValue(r.value(), Project.class));
    }

    public void save(Project project) throws Exception {
        byte[] data = objectMapper.writeValueAsBytes(project);
        hbaseTemplate.put(tableName, project.getId(), cfInfo, colData, data);
    }

    public void delete(String id) {
        hbaseTemplate.delete(tableName, id, cfInfo);
    }

    public Iterable<Project> findAll(Iterable<String> ids) throws IOException {
        return hbaseTemplate.execute(tableName, table -> {
            List<Get> queryRowList = new ArrayList<>();
            for(String id : ids) {
                queryRowList.add(new Get(Bytes.toBytes(id)));
            }
            Result[] results = table.get(queryRowList);
            return Arrays.stream(results).map(result -> {
                try {
                    return result.value() == null ? null : objectMapper.readValue(result.value(), Project.class);
                } catch (IOException e) {
                    log.error("Unable to read JSON for "+new String(result.getRow()));
                    return null;
                }
            })::iterator;
        });
    }
}
