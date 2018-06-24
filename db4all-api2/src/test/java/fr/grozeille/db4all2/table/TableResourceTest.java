package fr.grozeille.db4all2.table;


import com.erudika.para.client.ParaClient;
import com.erudika.para.utils.Pager;
import fr.grozeille.db4all2.ClusterConfiguration;
import fr.grozeille.db4all2.ParaConfiguration;
import fr.grozeille.db4all2.table.model.Table;
import fr.grozeille.db4all2.table.web.TableResource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.map.HashedMap;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.fest.assertions.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment= SpringBootTest.WebEnvironment.RANDOM_PORT)
public class TableResourceTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    public void test() {
        //String body = this.restTemplate.getForObject("/", String.class);
        //assertThat(body).isEqualTo("Hello World");

    }
}
