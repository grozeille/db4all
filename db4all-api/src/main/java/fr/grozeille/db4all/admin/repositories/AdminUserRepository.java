package fr.grozeille.db4all.admin.repositories;

import fr.grozeille.db4all.admin.model.AdminUser;
import fr.grozeille.db4all.configurations.stereotype.JpaRepository;
import org.springframework.data.repository.CrudRepository;

@JpaRepository
public interface AdminUserRepository extends CrudRepository<AdminUser, String> {
}
