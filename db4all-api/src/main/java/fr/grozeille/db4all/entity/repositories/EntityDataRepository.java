package fr.grozeille.db4all.entity.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Iterables;
import fr.grozeille.db4all.entity.model.Entity;
import fr.grozeille.db4all.entity.model.EntityData;
import fr.grozeille.db4all.entity.model.EntityField;
import fr.grozeille.db4all.entity.model.EntityFieldType;
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
import java.lang.reflect.Array;
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

    private final String colDummy = "#dummy#";
    private final byte[] colDummyBytes = Bytes.toBytes(colDummy);

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void save(String projectId, String entityId, EntityData data) throws Exception {
        createTable(projectId, entityId);

        Entity entity = entityRepository.findOne(projectId, entityId);
        Map<Integer, EntityFieldType> fieldTypes = new HashMap<>();
        for(EntityField f : entity.getFields()) {
            fieldTypes.put(f.getFieldId(), f.getType());
        }

        String name = projectId + "_" + entityId;
        Integer lastRowId = hbaseTemplate.execute(name, table -> {
            List<Put> puts = new ArrayList<>();

            byte[] cfDataBytes = Bytes.toBytes(cfData);

            int rowId = 0;
            for(Map<String, Object> map : data.getData()) {

                Put put = new Put(Bytes.toBytes(rowId));
                for(Map.Entry<String, Object> entry : map.entrySet()) {

                    Integer columnId = Integer.parseInt(entry.getKey());
                    byte[] columnValue;

                    EntityFieldType fieldType = fieldTypes.get(columnId);
                    if(fieldType == EntityFieldType.BOOL) {
                        if(entry.getValue().getClass().equals(boolean.class)) {
                            columnValue = Bytes.toBytes((boolean)entry.getValue());
                        }
                        else if(entry.getValue() == null) {
                            columnValue = Bytes.toBytes(false);
                        }
                        else {
                            try {
                                columnValue = Bytes.toBytes(Boolean.parseBoolean(entry.getValue().toString()));
                            }catch(Exception ex) {
                                columnValue = Bytes.toBytes(false);
                                log.error("Unable to parse column "+columnId+" as boolean");
                            }
                        }
                    }
                    else if(fieldType == EntityFieldType.NUMERIC) {
                        if(entry.getValue().getClass().equals(double.class)) {
                            columnValue = Bytes.toBytes((double)entry.getValue());
                        }
                        else if(entry.getValue().getClass().equals(int.class)) {
                            columnValue = Bytes.toBytes((double)((int)entry.getValue()));
                        }
                        else if(entry.getValue() == null) {
                            columnValue = Bytes.toBytes(0.0);
                        }
                        else {
                            try {
                                columnValue = Bytes.toBytes(Double.parseDouble(entry.getValue().toString()));
                            }catch(Exception ex) {
                                columnValue = Bytes.toBytes(false);
                                log.error("Unable to parse column "+columnId+" as numeric");
                            }
                        }
                    }
                    else if(fieldType == EntityFieldType.LINK || fieldType == EntityFieldType.LINK_MULTIPLE) {
                        if(entry.getValue() instanceof Iterable) {
                            columnValue = Bytes.toBytes(objectMapper.writeValueAsString(entry.getValue()));
                        }
                        else if(entry.getValue() == null) {
                            columnValue = Bytes.toBytes(objectMapper.writeValueAsString(new Map[0]));
                        }
                        else {
                            try {
                                columnValue = Bytes.toBytes(entry.getValue().toString());
                            }catch(Exception ex) {
                                columnValue = Bytes.toBytes(objectMapper.writeValueAsString(new Map[0]));
                                log.error("Unable to parse column "+columnId+" as array");
                            }
                        }
                    }
                    else {
                        if(entry.getValue() == null) {
                            columnValue = Bytes.toBytes("");
                        }
                        else {
                            columnValue = Bytes.toBytes(entry.getValue().toString());
                        }
                    }

                    put.addColumn(cfDataBytes, Bytes.toBytes(entry.getKey()), columnValue);
                }

                // to be able to save empty rows
                put.addColumn(cfDataBytes, colDummyBytes, null);

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

        Map<String, EntityFieldType> fieldTypes = new HashMap<>();

        HashSet<String> columns = new HashSet<>();
        Entity entity = entityRepository.findOne(projectId, entityId);
        for(EntityField f : entity.getFields()) {
            columns.add(Integer.toString(f.getFieldId()));
            fieldTypes.put(Integer.toString(f.getFieldId()), f.getType());
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
                    String columnId = Bytes.toString(columnNameBytes);
                    Object columnValue;

                    EntityFieldType fieldType = fieldTypes.get(columnId);
                    if(fieldType == EntityFieldType.BOOL) {
                        try {
                            columnValue = Bytes.toBoolean(valueBytes);
                        }catch(Exception ex) {
                            columnValue = false;
                            log.error("Unable to parse column "+columnId+" as boolean");
                        }
                    }
                    else if(fieldType == EntityFieldType.NUMERIC) {
                        try {
                            columnValue = Bytes.toDouble(valueBytes);
                        }catch(Exception ex) {
                            columnValue = 0.0;
                            log.error("Unable to parse column "+columnId+" as numeric");
                        }
                    }
                    else if(fieldType == EntityFieldType.LINK || fieldType == EntityFieldType.LINK_MULTIPLE) {
                        try {
                            columnValue = objectMapper.readValue(Bytes.toString(valueBytes), Map[].class);
                        }catch(Exception ex) {
                            columnValue = new Map[0];
                            log.error("Unable to parse column "+columnId+" as array");
                        }
                    }
                    else {
                        columnValue = Bytes.toString(valueBytes);
                    }


                    if(columns.contains(columnId)) {
                        row.put(columnId, columnValue);
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
