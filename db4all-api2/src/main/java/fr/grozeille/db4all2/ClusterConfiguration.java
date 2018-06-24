package fr.grozeille.db4all2;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "db4all")
public class ClusterConfiguration {
    private String adminToken;

    private ParaConfiguration para;
}
