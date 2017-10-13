package fr.grozeille.db4all;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.solr.SolrAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude={DataSourceAutoConfiguration.class, SolrAutoConfiguration.class})
@EnableScheduling
@EnableConfigurationProperties
@Slf4j
public class Application {

	public static void main(String[] args) {

		ConfigurableApplicationContext context = SpringApplication.run(Application.class, args);

		log.info("\n"+
				"*****************************************\n"+
				"\n"+
				" ADMIN TOKEN: " + context.getBean(ClusterConfiguration.class).getAdminToken()+"\n"+
				"\n"+
				"*****************************************");

	}
}
