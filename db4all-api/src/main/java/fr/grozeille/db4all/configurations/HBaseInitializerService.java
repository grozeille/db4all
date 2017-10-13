package fr.grozeille.db4all.configurations;

import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.HColumnDescriptor;
import org.apache.hadoop.hbase.HTableDescriptor;
import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.TableNotFoundException;
import org.apache.hadoop.hbase.client.HBaseAdmin;
import org.apache.hadoop.hbase.io.compress.Compression;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class HBaseInitializerService implements InitializingBean {
    @Autowired
    private HbaseTemplate hbaseTemplate;

    @Autowired
    private HBaseAdmin hbaseAdmin;

    @Override
    public void afterPropertiesSet() throws Exception {
        createDefaultTable("projects", "cfInfo", "cfEntities");
        createDefaultTable("admins", "cfInfo");
        createDefaultTable("users", "cfInfo");
    }

    private void createDefaultTable(String name, String... columnFamilies) throws IOException {
        try {
            hbaseAdmin.getTableDescriptor(TableName.valueOf(name));
        }catch (TableNotFoundException nf) {
            log.info("Table "+name+" not found, creating it...");
            HTableDescriptor tableDescriptor = new HTableDescriptor(TableName.valueOf(name));
            for(String c : columnFamilies) {
                HColumnDescriptor hColumnDescriptor = new HColumnDescriptor(c);
                hColumnDescriptor.setCompressionType(Compression.Algorithm.GZ);
                tableDescriptor.addFamily(hColumnDescriptor);
            }
            hbaseAdmin.createTable(tableDescriptor);
        }
    }
}
