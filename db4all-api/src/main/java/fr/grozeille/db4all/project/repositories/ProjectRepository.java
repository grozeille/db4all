package fr.grozeille.db4all.project.repositories;

import fr.grozeille.db4all.configurations.stereotype.JpaRepository;
import fr.grozeille.db4all.project.model.Project;
import org.springframework.data.repository.CrudRepository;

@JpaRepository
public interface ProjectRepository extends CrudRepository<Project, String> {
}
