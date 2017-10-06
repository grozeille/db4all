package fr.grozeille.db4all.user.repositories;

import fr.grozeille.db4all.configurations.stereotype.JpaRepository;
import fr.grozeille.db4all.user.model.User;
import org.springframework.data.repository.CrudRepository;

@JpaRepository
public interface UserRepository extends CrudRepository<User, String> {
}
