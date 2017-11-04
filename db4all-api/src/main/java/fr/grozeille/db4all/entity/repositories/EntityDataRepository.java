package fr.grozeille.db4all.entity.repositories;

import fr.grozeille.db4all.entity.model.Entity;
import fr.grozeille.db4all.entity.model.EntityData;
import fr.grozeille.db4all.entity.model.EntityField;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.*;
import org.apache.hadoop.hbase.client.*;
import org.apache.hadoop.hbase.client.coprocessor.Batch;
import org.apache.hadoop.hbase.filter.FilterList;
import org.apache.hadoop.hbase.filter.FirstKeyOnlyFilter;
import org.apache.hadoop.hbase.filter.KeyOnlyFilter;
import org.apache.hadoop.hbase.io.compress.Compression;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.data.hadoop.hbase.ResultsExtractor;
import org.springframework.data.hadoop.hbase.RowMapper;
import org.springframework.data.hadoop.hbase.TableCallback;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.*;
import java.util.function.Consumer;

@Slf4j
@Component
public class EntityDataRepository {
    @Autowired
    private HbaseTemplate hbaseTemplate;

    @Autowired
    private HBaseAdmin hbaseAdmin;

    @Autowired
    private EntityRepository entityRepository;

    private final String cfData = "cfData";

    public void save(String projectId, String entityId, EntityData data) throws Exception {
        createTable(projectId, entityId);

        String name = projectId + "_" + entityId;
        Integer lastRowId = hbaseTemplate.execute(name, table -> {
            List<Put> puts = new ArrayList<>();

            byte[] cfDataBytes = Bytes.toBytes(cfData);

            int rowId = 0;
            for(Map<String, Object> map : data.getData()) {

                Put put = new Put(Bytes.toBytes(rowId));
                for(Map.Entry<String, Object> entry : map.entrySet()) {
                    if(entry.getValue() != null) {
                        put.addColumn(cfDataBytes, Bytes.toBytes(entry.getKey()), Bytes.toBytes(entry.getValue().toString()));
                    }
                    else {
                        put.addColumn(cfDataBytes, Bytes.toBytes(entry.getKey()), null);
                    }
                }

                puts.add(put);

                rowId++;
            }

            table.put(puts);
            return rowId;
        });

        hbaseTemplate.execute(name, table -> {

            int bufferSize = 10000;

            Scan scan = new Scan(Bytes.toBytes(lastRowId));
            scan.setBatch(bufferSize);
            FilterList filters = new FilterList(FilterList.Operator.MUST_PASS_ALL,
                    new FirstKeyOnlyFilter(),
                    new KeyOnlyFilter());
            scan.setFilter(filters);
            ResultScanner scanner = table.getScanner(scan);
            List<Delete> deletes = new ArrayList<>();
            for (Result r : scanner) {
                deletes.add(new Delete(r.getRow()));

                if(deletes.size() >= bufferSize){
                    table.delete(deletes);
                    deletes.clear();
                }
            }

            if(deletes.size() > 0){
                table.delete(deletes);
                deletes.clear();
            }

            return null;
        });
    }

    public EntityData findOne(String projectId, String entityId) throws Exception {
        EntityData entityData = new EntityData();

        createTable(projectId, entityId);

        HashSet<String> columns = new HashSet<>();
        Entity entity = entityRepository.findOne(projectId, entityId);
        for(EntityField f : entity.getFields()) {
            columns.add(f.getName());
        }

        String name = projectId + "_" + entityId;
        List<Map<String, Object>> data = hbaseTemplate.find(name, cfData, (result, rowNum) -> {

            Map<String, Object> row = new HashMap<>();

            CellScanner scanner = result.cellScanner();
            try {
                while (scanner.advance()) {
                    Cell cell = scanner.current();
                    byte[] columnNameBytes = Bytes.copy(cell.getQualifierArray(),
                            cell.getQualifierOffset(),
                            cell.getQualifierLength());
                    byte[] familyNameBytes = Bytes.copy(cell.getFamilyArray(),
                            cell.getFamilyOffset(),
                            cell.getFamilyLength());
                    byte[] valueBytes = Bytes.copy(cell.getValueArray(),
                            cell.getValueOffset(),
                            cell.getValueLength());
                    String columnName = Bytes.toString(columnNameBytes);
                    String columnValue = Bytes.toString(valueBytes);

                    if(columns.contains(columnName)) {
                        row.put(columnName, columnValue);
                    }
                }
            } catch (IOException e) {
                log.error("Unable to read row", e);
            }
            return row;
        });

        entityData.setData(data);

        return entityData;
    }

    public void delete(String projectId, String entityId) {

    }

    private void createTable(String projectId, String entityId) throws IOException {
        String name = projectId + "_" + entityId;
        try {
            hbaseAdmin.getTableDescriptor(TableName.valueOf(name));
        }catch (TableNotFoundException nf) {
            log.info("Table "+name+" not found, creating it...");
            HTableDescriptor tableDescriptor = new HTableDescriptor(TableName.valueOf(name));
            HColumnDescriptor hColumnDescriptor = new HColumnDescriptor(cfData);
            //hColumnDescriptor.setCompressionType(Compression.Algorithm.GZ);
            tableDescriptor.addFamily(hColumnDescriptor);
            hbaseAdmin.createTable(tableDescriptor);
        }
    }
}
