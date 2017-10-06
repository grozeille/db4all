package fr.grozeille.db4all.entity.repositories;

import fr.grozeille.db4all.entity.model.EntitySearchItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.solr.repository.Query;
import org.springframework.data.solr.repository.SolrCrudRepository;

public interface EntityRepository extends SolrCrudRepository<EntitySearchItem, String> {

    @Query(value = "text:?0 AND project:?1")
    Page<EntitySearchItem> findAllAndProject(Pageable pageable, String filter, String project);
}