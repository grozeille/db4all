package fr.grozeille.db4all.entity.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Ordering;
import fr.grozeille.db4all.entity.model.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.*;
import org.apache.hadoop.hbase.client.*;
import org.apache.hadoop.hbase.filter.FilterList;
import org.apache.hadoop.hbase.filter.FirstKeyOnlyFilter;
import org.apache.hadoop.hbase.filter.KeyOnlyFilter;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.*;

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

    private final String rowMeta = "#meta#";
    private final String colVersion = "#last_version#";
    private final String colRowId = "#row_id#";
    private final String colRowIndex = "#row_index#";
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

        final String tableName = projectId + "_" + entityId;
        final String metaTableName = tableName + "_meta";

        // get the current version
        final Long currentVersionValue = getVersion(metaTableName);
        final Long lastVersionValue = currentVersionValue + 1;

        hbaseTemplate.execute(tableName, table -> {
            List<Put> puts = new ArrayList<>();

            byte[] cfDataBytes = Bytes.toBytes(cfData);

            int rowIndex = 0;
            String rowId;
            for(Map<String, Object> map : data.getData()) {

                // create the rowkey
                Object rowIdValue = map.get(colRowId);
                if(rowIdValue == null) {
                    rowId = UUID.randomUUID().toString();
                }
                else {
                    rowId = rowIdValue.toString();
                }
                String rowKey = Long.toString(lastVersionValue) + '#' + rowId;

                Put put = new Put(Bytes.toBytes(rowKey));

                // add special column with index of the row
                put.addColumn(cfDataBytes, Bytes.toBytes(colRowIndex), Bytes.toBytes(rowIndex));

                // add all other columns
                for(Map.Entry<String, Object> entry : map.entrySet()) {

                    if(entry.getKey().equals(colRowId) || entry.getKey().equals(colRowIndex)) {
                        continue;
                    }

                    Integer columnId = Integer.parseInt(entry.getKey());
                    byte[] columnValue;

                    EntityFieldType fieldType = fieldTypes.get(columnId);
                    if(fieldType == EntityFieldType.BOOL) {
                        if(entry.getValue() == null) {
                            columnValue = Bytes.toBytes(false);
                        }
                        else if(entry.getValue().getClass().equals(boolean.class)) {
                            columnValue = Bytes.toBytes((boolean)entry.getValue());
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
                        if(entry.getValue() == null) {
                            columnValue = Bytes.toBytes(0.0);
                        }
                        else if(entry.getValue().getClass().equals(double.class)) {
                            columnValue = Bytes.toBytes((double)entry.getValue());
                        }
                        else if(entry.getValue().getClass().equals(int.class)) {
                            columnValue = Bytes.toBytes((double)((int)entry.getValue()));
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
                        if(entry.getValue() == null) {
                            columnValue = Bytes.toBytes(objectMapper.writeValueAsString(new Map[0]));
                        }
                        else if(entry.getValue() instanceof Iterable) {
                            columnValue = Bytes.toBytes(objectMapper.writeValueAsString(entry.getValue()));
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

                rowIndex++;
            }

            // save the data
            table.put(puts);

            return null;
        });

        // update the current version
        changeVersion(metaTableName, lastVersionValue);

        // remove too old data
        cleanOldVersions(tableName, lastVersionValue);
    }

    public EntityData findOne(String projectId, String entityId) throws Exception {
        EntityData entityData = new EntityData();

        // createTable(projectId, entityId);

        final Map<String, EntityFieldType> fieldTypes = new HashMap<>();
        final Map<String, EntityField> fieldMap = new HashMap<>();
        final HashSet<String> linkColumns = new HashSet<>();
        final HashSet<String> columns = new HashSet<>();
        final Entity entity = entityRepository.findOne(projectId, entityId);
        for(EntityField f : entity.getFields()) {
            columns.add(Integer.toString(f.getFieldId()));
            fieldTypes.put(Integer.toString(f.getFieldId()), f.getType());
            fieldMap.put(Integer.toString(f.getFieldId()), f);
            if(f.getType() == EntityFieldType.LINK || f.getType() == EntityFieldType.LINK_MULTIPLE) {
                linkColumns.add(Integer.toString(f.getFieldId()));
            }
        }
        final Map<String, EntityField> linkFieldMap = new HashMap<>();
        for(String linkColumn : linkColumns){
            EntityField field = fieldMap.get(linkColumn);
            Entity linkedEntity = entityRepository.findOne(projectId, field.getEntityId());
            for(EntityField f : linkedEntity.getFields()) {
                if(f.getFieldId() == field.getEntityField()) {
                    linkFieldMap.put(field.getEntityId() + "#" + Long.toString(field.getEntityField()), f);
                    break;
                }
            }
        }

        final String tableName = projectId + "_" + entityId;
        final String metaTableName = tableName + "_meta";

        // get the current version
        final Long currentVersion = getVersion(metaTableName);

        // get the data of the current version

        int bufferSize = 10000;

        Scan scan = new Scan(Bytes.toBytes(Long.toString(currentVersion) + "#"), Bytes.toBytes(Long.toString(currentVersion + 1) + "#"));
        scan.addFamily(Bytes.toBytes(cfData));
        scan.setBatch(bufferSize);

        List<Map<String, Object>> data = hbaseTemplate.find(tableName, scan, (result, rowNum) -> {

            Map<String, Object> row = new HashMap<>();

            // add special column with unique id
            String rowKey = Bytes.toString(result.getRow());
            String[] rowKeySplit = rowKey.split("#");

            row.put(colRowId, rowKeySplit[1]);

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

                    // special column to store the index
                    if(columnId.equals(colRowIndex)) {
                        row.put(colRowIndex, Bytes.toInt(valueBytes));
                        continue;
                    }

                    // add the column to the row
                    EntityFieldType fieldType = fieldTypes.get(columnId);
                    columnValue = parseColumnValue(valueBytes, columnId, fieldType);

                    if(columns.contains(columnId) || columnId.equals(colRowId)) {
                        row.put(columnId, columnValue);
                    }
                }
            } catch (IOException e) {
                log.error("Unable to read row", e);
            }
            return row;
        });

        // sort the rows & remove special index field
        data = Ordering.from((Comparator<Map<String, Object>>) (o1, o2) -> ((Integer)o1.get(colRowIndex)).compareTo((Integer)o2.get(colRowIndex))).sortedCopy(data);
        for(Map<String, Object> row : data) {
            row.remove(colRowIndex);
        }

        // update the value of the links
        Map<String, Map<String, String>> colToLinkCache = new HashMap<>();

        // for each rows, update the links
        for(Map<String, Object> row : data) {
            for(String col : linkColumns) {
                Object value = row.get(col);
                if(value != null) {
                    Map<String, String>[] linkValues = (Map<String, String>[])value;

                    // for each column of "link" type
                    for(Map<String, String> linkValue : linkValues) {
                        String id = linkValue.get("id");
                        String savedValue = linkValue.get("display");

                        // try to ge the value from cache
                        Map<String, String> linkCache = colToLinkCache.get(col);
                        if(linkCache == null) {
                            linkCache = new HashMap<>();
                            colToLinkCache.put(col, linkCache);
                        }
                        String cachedValue = linkCache.get(id);

                        // if not found, get the value from the table
                        if(cachedValue == null) {
                            // get the field of that column
                            final EntityField field = fieldMap.get(col);

                            final String linkTableName = projectId + "_" + field.getEntityId();
                            final String linkMetaTableName = linkTableName + "_meta";
                            final Long linkTableVersion = getVersion(linkMetaTableName);
                            final String linkVersionId = Long.toString(linkTableVersion) + "#" + id;

                            // find the data of the table
                            Object newLinkValue = hbaseTemplate.get(linkTableName, linkVersionId, cfData, (result, rowNum) -> {
                               Cell cell = result.getColumnLatestCell(Bytes.toBytes(cfData), Bytes.toBytes(Integer.toString(field.getEntityField())));
                               if(cell == null) {
                                   log.warn("Id: "+linkVersionId+" in Table:"+linkTableName+" doesn't exist.");
                                   return null;
                               }
                               byte[] valueBytes = Bytes.copy(cell.getValueArray(),
                                        cell.getValueOffset(),
                                        cell.getValueLength());

                               EntityField linkField = linkFieldMap.get(field.getEntityId() + "#" + Long.toString(field.getEntityField()));

                               return parseColumnValue(valueBytes, Integer.toString(linkField.getFieldId()), linkField.getType());
                            });
                            cachedValue = newLinkValue.toString();
                            linkCache.put(id, cachedValue);
                        }

                        // update the value of the column
                        linkValue.put("display", cachedValue);
                    }
                }
            }
        }

        entityData.setData(data);

        return entityData;
    }

    public Long changeVersion(String projectId, String entityId, Long version) throws IOException {
        createTable(projectId, entityId);

        String name = projectId + "_" + entityId + "_meta";
        return changeVersion(name, version);
    }

    private Long getVersion(String tableName) {
        return hbaseTemplate.get(tableName, rowMeta, cfData, colVersion, (result, rowNum) -> {
                Cell cell = result.getColumnLatestCell(Bytes.toBytes(cfData), Bytes.toBytes(colVersion));
                if(cell == null) {
                    return 0l;
                }
                else {
                    byte[] valueBytes = Bytes.copy(cell.getValueArray(),
                            cell.getValueOffset(),
                            cell.getValueLength());
                    return Bytes.toLong(valueBytes);
                }
            });
    }

    private Long changeVersion(String tableName, Long version) {
        return hbaseTemplate.execute(tableName, table -> {
            Put put = new Put(Bytes.toBytes(rowMeta));
            byte[] cfDataBytes = Bytes.toBytes(cfData);
            // add special column with index of the row
            put.addColumn(cfDataBytes, Bytes.toBytes(colVersion), Bytes.toBytes(version));

            table.put(put);
            return version;
        });
    }

    public boolean acquireLock(String projectId, String entityId) {
        return false;
    }

    public EntityLock getLock() {
        return null;
    }

    private Long incrementVersion(String tableName) throws IOException {
        return hbaseTemplate.execute(tableName, table -> {
            byte[] cfDataBytes = Bytes.toBytes(cfData);
            Increment inc = new Increment(Bytes.toBytes(rowMeta));
            inc.addColumn(cfDataBytes, Bytes.toBytes(colVersion), 1L);
            Result incResult = table.increment(inc);
            Cell lastVersion = incResult.getColumnLatestCell(cfDataBytes, Bytes.toBytes(colVersion));
            byte[] valueBytes = Bytes.copy(
                    lastVersion.getValueArray(),
                    lastVersion.getValueOffset(),
                    lastVersion.getValueLength());
            return Bytes.toLong(valueBytes);
        });
    }

    private void cleanOldVersions(String tableName, Long lastVersion) throws IOException {
        hbaseTemplate.execute(tableName, table -> {
            // keep only 20 historical versions
            long oldestVersion = lastVersion - 20;

            int bufferSize = 10000;

            Scan scan = new Scan(Bytes.toBytes(Long.toString(0l) + "#"), Bytes.toBytes(Long.toString(oldestVersion) + "#"));
            scan.setBatch(bufferSize);
            FilterList filters = new FilterList(FilterList.Operator.MUST_PASS_ALL,
                    new FirstKeyOnlyFilter(),
                    new KeyOnlyFilter());
            scan.setFilter(filters);
            ResultScanner scanner = table.getScanner(scan);
            List<Delete> deletes = new ArrayList<>();
            for (Result r : scanner) {
                deletes.add(new Delete(r.getRow()));

                if (deletes.size() >= bufferSize) {
                    table.delete(deletes);
                    deletes.clear();
                }
            }

            if (deletes.size() > 0) {
                table.delete(deletes);
                deletes.clear();
            }
            return null;
        });
    }

    private Object parseColumnValue(byte[] valueBytes, String columnId, EntityFieldType fieldType) {
        Object columnValue;
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
        return columnValue;
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
        String meta = name + "_meta";
        try {
            hbaseAdmin.getTableDescriptor(TableName.valueOf(meta));
        }catch (TableNotFoundException nf) {
            log.info("Table "+meta+" not found, creating it...");
            HTableDescriptor tableDescriptor = new HTableDescriptor(TableName.valueOf(meta));
            HColumnDescriptor hColumnDescriptor = new HColumnDescriptor(cfData);
            //hColumnDescriptor.setCompressionType(Compression.Algorithm.GZ);
            tableDescriptor.addFamily(hColumnDescriptor);
            hbaseAdmin.createTable(tableDescriptor);
        }
    }
}
