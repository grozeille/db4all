package fr.grozeille.db4all.entity.repositories;

import fr.grozeille.db4all.entity.model.EntitySearchItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.solr.repository.Query;
import org.springframework.data.solr.repository.SolrCrudRepository;

@NoRepositoryBean
public interface EntitySearchItemRepository extends SolrCrudRepository<EntitySearchItem, String> {

    @Query(value = "projectId:?0")
    Page<EntitySearchItem> findAllByProject(Pageable pageable, String projectId);

    @Query(value = "text:*?0* AND projectId:?1")
    Page<EntitySearchItem> findAllByProject(Pageable pageable, String filter, String projectId);

    @Query(value = "text:*?0*")
    Page<EntitySearchItem> findAll(Pageable pageable, String filter);
}