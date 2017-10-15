package fr.grozeille.db4all.configurations;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.google.common.base.Strings;
import fr.grozeille.db4all.project.model.Project;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.HColumnDescriptor;
import org.apache.hadoop.hbase.HTableDescriptor;
import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.TableNotFoundException;
import org.apache.hadoop.hbase.client.*;
import org.apache.hadoop.hbase.io.compress.Compression;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.annotation.Id;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.data.hadoop.hbase.RowMapper;
import org.springframework.data.hadoop.hbase.TableCallback;
import org.springframework.data.repository.CrudRepository;

import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.IOException;
import java.io.InvalidClassException;
import java.io.Serializable;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
public class HBaseJsonDataRepository<T> implements CrudRepository<T, String>, InitializingBean {
    @Autowired
    private HbaseTemplate hbaseTemplate;

    @Autowired
    private HBaseAdmin hbaseAdmin;

    protected final ObjectMapper objectMapper;

    protected final String tableName;

    protected final String cfInfo = "cfInfo";

    protected final String colData = "data";

    protected final Class entityClass;

    protected final String[] additionalColumnFamilies;

    private Field idField;

    private PropertyDescriptor idProp;

    public HBaseJsonDataRepository(Class entityClass, String tableName, String... additionalColumnFamilies) throws IntrospectionException, InvalidClassException {

        this.tableName = tableName;
        this.entityClass = entityClass;
        this.additionalColumnFamilies = additionalColumnFamilies;

        BeanInfo info = Introspector.getBeanInfo(entityClass);


        Field[] fields = entityClass.getDeclaredFields();
        for(Field field : fields){
            if(field.getAnnotation(Id.class) != null){
                if(!field.getType().equals(String.class)){
                    throw new InvalidClassException("The @Id must be of String type");
                }
                idField = field;
                idField.setAccessible(true);
                break;
            }
        }
        PropertyDescriptor[] props = info.getPropertyDescriptors(); //Gets all the properties for the class.
        for(PropertyDescriptor prop : props){
            if(prop.getReadMethod().getAnnotation(Id.class) != null){
                if(!prop.getPropertyType().equals(String.class)){
                    throw new InvalidClassException("The @Id must be of String type");
                }
                idProp = prop;
                break;
            }
        }

        if(idField == null && idProp == null){
            throw new InvalidClassException("The class must have @Id");
        }

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Override
    public <S extends T> S save(S entity) {
        byte[] data = new byte[0];
        try {
            String id = this.getId(entity);
            if(Strings.isNullOrEmpty(id)){
                id = UUID.randomUUID().toString();
                this.setId(entity, id);
            }
            data = objectMapper.writeValueAsBytes(entity);
            hbaseTemplate.put(tableName, id, cfInfo, colData, data);
            return entity;
        } catch (JsonProcessingException e) {
            log.error("Unable to convert to Json object", e);
        } catch (IllegalAccessException e) {
            log.error("Unable to get Id", e);
        } catch (InvocationTargetException e) {
            log.error("Unable to get Id", e);
        }

        return entity;
    }

    @Override
    public <S extends T> Iterable<S> save(Iterable<S> entities) {
        Iterable<S> result = hbaseTemplate.execute(this.tableName, table -> {
            List<Put> puts = new ArrayList<>();
            for(T e : entities){
                String id = getId(e);
                if(id == null){
                    id = UUID.randomUUID().toString();
                    setId(e, id);
                }

                Put put = toPut(e);
                if(put != null){
                    puts.add(put);
                }
            }
            table.put(puts);

            return entities;
        });

        return result;
    }

    @Override
    public T findOne(String id) {
        return hbaseTemplate.get(tableName, id, cfInfo, colData, (r,n) -> map(r));
    }

    @Override
    public boolean exists(String id) {
        return hbaseTemplate.execute(tableName, table -> table.exists(new Get(Bytes.toBytes(id))));
    }

    @Override
    public void delete(String id) {
        hbaseTemplate.delete(tableName, id, cfInfo);
    }

    @Override
    public void delete(T entity) {
        String id = null;
        try {
            id = getId(entity);
        } catch (IllegalAccessException e) {
            log.error("Unable to get Id", e);
        } catch (InvocationTargetException e) {
            log.error("Unable to get Id", e);
        }
        delete(id);
    }

    @Override
    public void delete(Iterable<? extends T> entities) {
        hbaseTemplate.execute(tableName, table -> {
            List<Delete> deletes = new ArrayList<>();
            for(T e : entities){
                Delete delete = new Delete(Bytes.toBytes(getId(e)));
                deletes.add(delete);
            }
            table.delete(deletes);
            return null;
        });
    }

    @Override
    public void deleteAll() {
        try {
            deleteTable();
            createTable();
        } catch (IOException e) {
            log.error("Unable to delete table elements");
        }
    }

    @Override
    public Iterable<T> findAll(){
        return hbaseTemplate.find(tableName, cfInfo, colData, (result, rowNum) -> map(result));
    }

    @Override
    public Iterable<T> findAll(Iterable<String> ids) {
        return hbaseTemplate.execute(tableName, table -> {
            List<Get> queryRowList = new ArrayList<>();
            for(String id : ids) {
                queryRowList.add(new Get(Bytes.toBytes(id)));
            }
            Result[] results = table.get(queryRowList);
            return Arrays.stream(results).map(result -> map(result))::iterator;
        });
    }

    @Override
    public long count() {
        log.warn("Not implemented, must run a MapReduce job: http://hbase.apache.org/book.html#ops_mgt");
        return 0;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        createTable();
    }

    protected void deleteTable() throws IOException {
        hbaseAdmin.disableTable(TableName.valueOf(tableName));
        hbaseAdmin.deleteTable(TableName.valueOf(tableName));
    }

    protected void createTable() throws IOException {
        try {
            hbaseAdmin.getTableDescriptor(TableName.valueOf(tableName));
        }catch (TableNotFoundException nf) {
            log.info("Table "+tableName+" not found, creating it...");
            HTableDescriptor tableDescriptor = new HTableDescriptor(TableName.valueOf(tableName));
            HColumnDescriptor hColumnDescriptor = new HColumnDescriptor(cfInfo);
            hColumnDescriptor.setCompressionType(Compression.Algorithm.GZ);
            tableDescriptor.addFamily(hColumnDescriptor);
            for(String c : additionalColumnFamilies) {
                hColumnDescriptor = new HColumnDescriptor(c);
                hColumnDescriptor.setCompressionType(Compression.Algorithm.GZ);
                tableDescriptor.addFamily(hColumnDescriptor);
            }
            hbaseAdmin.createTable(tableDescriptor);
        }
    }

    private T map(Result result){
        try {
            return result.value() == null ? null : (T)objectMapper.readValue(result.value(), entityClass);
        } catch (IOException e) {
            log.error("Unable to read JSON for "+new String(result.getRow()));
            return null;
        }
    }

    protected String getId(T object) throws IllegalAccessException, InvocationTargetException {
        if(idField != null){
            return (String)idField.get(object);
        }
        //else if(idProp != null){
            return (String)idProp.getReadMethod().invoke(object);
        //}
    }


    protected void setId(T object, String id) throws InvocationTargetException, IllegalAccessException {
        if(idField != null){
            idField.set(object, id);
        }
        else if(idProp != null){
            idProp.getWriteMethod().invoke(object, id);
        }
    }


    protected Put toPut(T entity){
        byte[] data;
        try {
            data = objectMapper.writeValueAsBytes(entity);
            String id = this.getId(entity);
            Put put = new Put(Bytes.toBytes(id));
            put.addColumn(Bytes.toBytes(cfInfo), Bytes.toBytes(colData), data);

            return put;

        } catch (JsonProcessingException e) {
            log.error("Unable to convert to Json object", e);
        } catch (IllegalAccessException e) {
            log.error("Unable to get Id", e);
        } catch (InvocationTargetException e) {
            log.error("Unable to get Id", e);
        }

        return null;
    }

}
