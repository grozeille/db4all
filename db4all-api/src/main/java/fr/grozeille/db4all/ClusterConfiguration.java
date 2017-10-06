package fr.grozeille.db4all;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "db4all")
public class ClusterConfiguration {
    private ClusterSolrConfiguration solr;

    private String adminToken;
}
