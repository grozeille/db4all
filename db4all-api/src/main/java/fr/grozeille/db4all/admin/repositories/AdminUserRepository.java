package fr.grozeille.db4all.admin.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.grozeille.db4all.admin.model.AdminUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.stereotype.Component;

@Component
public class AdminUserRepository {
    @Autowired
    private HbaseTemplate hbaseTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String tableName = "admins";

    private final String cfInfo = "cfInfo";

    private final String colData = "data";

    public AdminUser findOne(String login) {
        return hbaseTemplate.get(tableName, login, cfInfo, colData, (r,n) -> r.value() == null ? null : objectMapper.readValue(r.value(), AdminUser.class));
    }

    public void save(AdminUser user) throws Exception {
        byte[] data = objectMapper.writeValueAsBytes(user);
        hbaseTemplate.put(tableName, user.getLogin(), cfInfo, colData, data);
    }

    public void delete(String login) {
        hbaseTemplate.delete(tableName, login, cfInfo);
    }

    public Iterable<AdminUser> findAll() {
        return hbaseTemplate.find(tableName, cfInfo, colData, (r,n) -> objectMapper.readValue(r.value(), AdminUser.class));
    }
}
