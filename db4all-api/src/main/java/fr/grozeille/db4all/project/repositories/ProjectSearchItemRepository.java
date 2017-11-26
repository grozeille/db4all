package fr.grozeille.db4all.project.repositories;

import fr.grozeille.db4all.project.model.ProjectSearchItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.solr.repository.Query;
import org.springframework.data.solr.repository.SolrCrudRepository;

@NoRepositoryBean
public interface ProjectSearchItemRepository extends SolrCrudRepository<ProjectSearchItem, String> {

    @Query(value = "text:*?0*")
    Page<ProjectSearchItem> findAll(Pageable pageable, String filter);
}