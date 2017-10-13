package fr.grozeille.db4all;

import lombok.Data;

@Data
public class ClusterHBaseConfiguration {
    private String zkUrl;
    private String namespace;
}
