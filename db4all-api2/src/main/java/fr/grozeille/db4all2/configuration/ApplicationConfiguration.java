package fr.grozeille.db4all2.configuration;

import com.erudika.para.client.ParaClient;
import fr.grozeille.db4all2.ClusterConfiguration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import javax.annotation.Resource;

@Configuration
public class ApplicationConfiguration {

    @Resource
    private Environment environment;

    @Bean
    @ConfigurationProperties
    public ClusterConfiguration clusterConfiguration(){
        return new ClusterConfiguration();
    }


    @Bean
    public ParaClient paraClient(){
        ClusterConfiguration clusterConfiguration = clusterConfiguration();

        ParaClient pc = new ParaClient(clusterConfiguration.getPara().getAccessKey(), clusterConfiguration.getPara().getSecretKey());
        // Para endpoint - http://localhost:8080 or https://paraio.com
        pc.setEndpoint(clusterConfiguration.getPara().getUrl());
        // Set this to true if you want ParaClient to throw exceptions on HTTP errors
        pc.throwExceptionOnHTTPError(false);
        // send a test request - this should return a JSON object of type 'app'
        pc.me();

        return pc;
    }
}
