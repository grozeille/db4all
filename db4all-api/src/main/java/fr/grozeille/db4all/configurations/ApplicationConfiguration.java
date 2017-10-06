package fr.grozeille.db4all.configurations;

import fr.grozeille.db4all.ClusterConfiguration;
import fr.grozeille.db4all.configurations.stereotype.JpaRepository;
import fr.grozeille.db4all.configurations.stereotype.SolrRepository;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.hive.conf.HiveConf;
import org.apache.hadoop.hive.metastore.HiveMetaStoreClient;
import org.apache.hadoop.hive.metastore.api.MetaException;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.impl.CloudSolrClient;
import org.springframework.boot.autoconfigure.jdbc.DataSourceBuilder;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.solr.core.SolrOperations;
import org.springframework.data.solr.core.SolrTemplate;
import org.springframework.data.solr.repository.config.EnableSolrRepositories;
import org.springframework.data.solr.server.support.EmbeddedSolrServerFactory;
import org.springframework.web.client.RestTemplate;
import org.xml.sax.SAXException;

import javax.annotation.Resource;
import javax.sql.DataSource;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;

//import org.springframework.security.oauth2.client.token.grant.code.AuthorizationCodeResourceDetails;

@EnableSolrRepositories(includeFilters = @ComponentScan.Filter(SolrRepository.class), basePackages = "fr.grozeille.db4all")
@EnableJpaRepositories(includeFilters = @ComponentScan.Filter(JpaRepository.class), basePackages = "fr.grozeille.db4all")
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
    public RestTemplate restTemplate(){
        //return new KerberosRestTemplate("/tmp/user.keytab", "user@EXAMPLE.ORG");
        return new RestTemplate();
    }

    @Bean
    @Primary
    @ConfigurationProperties(prefix="spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public SolrClient solrServer() throws IOException, SAXException, ParserConfigurationException {
        ClusterConfiguration configuration = clusterConfiguration();
        if(configuration.getSolr().isEmbedded()) {
            EmbeddedSolrServerFactory factory = new EmbeddedSolrServerFactory(configuration.getSolr().getHome());
            return factory.getSolrClient();
        }
        else {
            return new CloudSolrClient(configuration.getSolr().getZkUrl());
        }
    }

    @Bean
    public SolrOperations solrTemplate() throws ParserConfigurationException, SAXException, IOException {
        return new SolrTemplate(solrServer());
    }
}
