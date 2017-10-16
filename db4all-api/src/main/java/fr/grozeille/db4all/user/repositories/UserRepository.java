package fr.grozeille.db4all.user.repositories;

import fr.grozeille.db4all.configurations.HBaseJsonDataRepository;
import fr.grozeille.db4all.user.model.User;
import org.springframework.stereotype.Component;

import java.beans.IntrospectionException;
import java.io.InvalidClassException;

@Component
public class UserRepository extends HBaseJsonDataRepository<User> {

    public UserRepository() throws IntrospectionException, InvalidClassException {
        super(User.class, "users", new String[0]);
    }
}
