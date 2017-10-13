package fr.grozeille.db4all.user.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import fr.grozeille.db4all.user.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.stereotype.Component;

@Component
public class UserRepository {

    @Autowired
    private HbaseTemplate hbaseTemplate;

    private final ObjectMapper objectMapper;

    private final String tableName = "users";

    private final String cfInfo = "cfInfo";

    private final String colData = "data";

    public UserRepository(){
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public User findOne(String login) {
        return hbaseTemplate.get(tableName, login, cfInfo, colData, (r,n) -> r.value() == null ? null : objectMapper.readValue(r.value(), User.class));
    }

    public void save(User user) throws Exception {
        byte[] data = objectMapper.writeValueAsBytes(user);
        hbaseTemplate.put(tableName, user.getLogin(), cfInfo, colData, data);
    }

    public void delete(String login) {
        hbaseTemplate.delete(tableName, login, cfInfo);
    }

    public Iterable<User> findAll() {
        return hbaseTemplate.find(tableName, cfInfo, colData, (r,n) -> objectMapper.readValue(r.value(), User.class));
    }
}
