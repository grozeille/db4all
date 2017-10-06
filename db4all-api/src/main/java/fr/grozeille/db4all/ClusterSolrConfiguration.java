package fr.grozeille.db4all;

import lombok.Data;

@Data
public class ClusterSolrConfiguration {
    private boolean embedded;
    private String home;
    private String zkUrl;
}
