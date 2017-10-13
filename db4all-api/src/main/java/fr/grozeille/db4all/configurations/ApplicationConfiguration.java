package fr.grozeille.db4all.configurations;

import fr.grozeille.db4all.ClusterConfiguration;
import fr.grozeille.db4all.entity.repositories.EntitySearchItemRepository;
import fr.grozeille.db4all.project.repositories.ProjectSearchItemRepository;
import org.apache.hadoop.hbase.client.HBaseAdmin;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.impl.CloudSolrClient;
import org.springframework.boot.autoconfigure.jdbc.DataSourceBuilder;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.data.hadoop.hbase.HbaseConfigurationFactoryBean;
import org.springframework.data.hadoop.hbase.HbaseTemplate;
import org.springframework.data.solr.core.SolrOperations;
import org.springframework.data.solr.core.SolrTemplate;
import org.springframework.data.solr.repository.support.SolrRepositoryFactory;
import org.springframework.web.client.RestTemplate;
import org.xml.sax.SAXException;

import javax.annotation.Resource;
import javax.sql.DataSource;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;

//import org.springframework.security.oauth2.client.token.grant.code.AuthorizationCodeResourceDetails;

//@EnableSolrRepositories()
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

    @Bean SolrClient solrProjectClient() throws ParserConfigurationException, SAXException, IOException {
        CloudSolrClient client = new CloudSolrClient(clusterConfiguration().getSolr().getZkUrl());
        client.setDefaultCollection("project");
        return client;
    }

    @Bean SolrClient solrEntityClient() throws ParserConfigurationException, SAXException, IOException {
        CloudSolrClient client = new CloudSolrClient(clusterConfiguration().getSolr().getZkUrl());
        client.setDefaultCollection("entity");
        return client;
    }

    @Bean(name = "solrProjectTemplate")
    public SolrOperations solrProjectTemplate() throws ParserConfigurationException, SAXException, IOException {
        return new SolrTemplate(solrProjectClient());
    }

    @Bean(name = "solrEntityTemplate")
    public SolrOperations solrEntityTemplate() throws ParserConfigurationException, SAXException, IOException {
        return new SolrTemplate(solrEntityClient());
    }

    @Bean
    public EntitySearchItemRepository entitySearchItemRepository() throws IOException, SAXException, ParserConfigurationException {
        return new SolrRepositoryFactory(this.solrEntityTemplate()).getRepository(EntitySearchItemRepository.class);
    }

    @Bean
    public ProjectSearchItemRepository projectSearchItemRepository() throws IOException, SAXException, ParserConfigurationException {
        return new SolrRepositoryFactory(this.solrProjectTemplate()).getRepository(ProjectSearchItemRepository.class);
    }

    @Bean
    public org.apache.hadoop.conf.Configuration configuration(){
        return new org.apache.hadoop.conf.Configuration();
    }

    @Bean
    public HbaseConfigurationFactoryBean hbaseConfigurationFactory(){
        String zkUrl = clusterConfiguration().getHbase().getZkUrl();
        HbaseConfigurationFactoryBean conf = new HbaseConfigurationFactoryBean();
        conf.setZkQuorum(zkUrl.split(":")[0]);
        conf.setZkPort(Integer.parseInt(zkUrl.split(":")[1]));

        return conf;
    }

    @Bean
    public HBaseAdmin hbaseAdmin() throws IOException {
        return new HBaseAdmin(hbaseConfigurationFactory().getObject());
    }

    @Bean
    public HbaseTemplate hbaseTemplate() {
        return new HbaseTemplate(hbaseConfigurationFactory().getObject());
    }
}
