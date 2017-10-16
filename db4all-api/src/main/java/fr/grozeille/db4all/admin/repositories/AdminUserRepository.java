package fr.grozeille.db4all.admin.repositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.grozeille.db4all.admin.model.AdminUser;
import fr.grozeille.db4all.configurations.HBaseJsonDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.stereotype.Component;

import java.beans.IntrospectionException;
import java.io.InvalidClassException;

@Component
public class AdminUserRepository extends HBaseJsonDataRepository<AdminUser> {

    public AdminUserRepository() throws IntrospectionException, InvalidClassException {
        super(AdminUser.class, "admins", new String[0]);
    }
}
