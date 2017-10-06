package fr.grozeille.db4all.user.repositories;

import fr.grozeille.db4all.configurations.stereotype.JpaRepository;
import fr.grozeille.db4all.user.model.UserWithProject;
import org.springframework.data.repository.CrudRepository;

@JpaRepository
public interface UserWithProjectRepository extends CrudRepository<UserWithProject, String> {
}
