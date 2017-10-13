package fr.grozeille.db4all.entity.repositories;


import com.fasterxml.jackson.databind.ObjectMapper;
import fr.grozeille.db4all.entity.model.Entity;
import fr.grozeille.db4all.project.model.Project;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.client.Get;
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
public class EntityRepository {
    @Autowired
    private HbaseTemplate hbaseTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String tableName = "projects";

    private final String cfEntities = "cfEntities";

    public Entity findOne(String project, String id) {
        return hbaseTemplate.get(tableName, project, cfEntities, id, (r, n) -> r.value() == null ? null : objectMapper.readValue(r.value(), Entity.class));
    }

    public void save(String project, Entity entity) throws Exception {
        byte[] data = objectMapper.writeValueAsBytes(entity);
        hbaseTemplate.put(tableName, project, cfEntities, entity.getId(), data);
    }

    public void delete(String project, String id) {
        hbaseTemplate.delete(tableName, project, cfEntities, id);
    }

    public Iterable<Entity> findAll(Iterable<String> ids) throws IOException {
        return hbaseTemplate.execute(tableName, table -> {
            List<Get> queryRowList = new ArrayList<>();
            for(String id : ids) {
                queryRowList.add(new Get(Bytes.toBytes(id)));
            }
            Result[] results = table.get(queryRowList);
            return Arrays.stream(results).map(result -> {
                try {
                    return result.value() == null ? null : objectMapper.readValue(result.value(), Entity.class);
                } catch (IOException e) {
                    log.error("Unable to read JSON for "+new String(result.getRow()));
                    return null;
                }
            })::iterator;
        });
    }
}
