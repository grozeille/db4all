package fr.grozeille.db4all;

import fr.grozeille.db4all.dataset.exceptions.HiveQueryException;
import fr.grozeille.db4all.dataset.model.HiveColumn;
import fr.grozeille.db4all.dataset.model.HiveTable;
import fr.grozeille.db4all.dataset.services.HiveService;
import org.apache.thrift.TException;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import static org.fest.assertions.Assertions.*;

import java.io.IOException;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment= SpringBootTest.WebEnvironment.RANDOM_PORT)
public class HiveServiceIT {

	@Autowired
    HiveService hiveService;

	private HiveTable buildHiveTable(){
		HiveTable hiveTable = new HiveTable();
		hiveTable.setDatabase("project_sample");
		hiveTable.setTable("test");
		hiveTable.setColumns(new HiveColumn[]{
				new HiveColumn("a", "string", "desc", null),
				new HiveColumn("b", "bigint", "desc", null)
		});
		hiveTable.setComment("my comment");
		hiveTable.setTags(new String[]{"cool", "new"});
		hiveTable.setCreator("test");

		return hiveTable;
	}

	@Test
	public void should_create_table() throws IOException, HiveQueryException, TException {
		HiveTable hiveTable = buildHiveTable();
		hiveService.createOrcTable(hiveTable);

		HiveTable result = hiveService.findOne(hiveTable.getDatabase(), hiveTable.getTable());

		assertThat(result).isNotNull();
	}

	@Test
	public void should_delete_table() throws IOException, HiveQueryException, TException {
		HiveTable hiveTable = buildHiveTable();
		hiveService.createOrcTable(hiveTable);

		HiveTable result = hiveService.findOne(hiveTable.getDatabase(), hiveTable.getTable());

		assertThat(result).isNotNull();

		hiveService.deleteTable(hiveTable);

		result = hiveService.findOne(hiveTable.getDatabase(), hiveTable.getTable());

		assertThat(result).isNull();
	}

	@Test
	public void should_delete_table_with_rollback() throws TException, IOException, HiveQueryException {
		HiveTable hiveTable = buildHiveTable();
		hiveService.createOrcTable(hiveTable);

		// error in the table creation
		hiveTable.setColumns(new HiveColumn[]{
				new HiveColumn("a", "string", "desc", null),
				new HiveColumn("b", "AAA", "desc", null)
		});

		hiveService.createOrcTable(hiveTable);

		HiveTable result = hiveService.findOne(hiveTable.getDatabase(), hiveTable.getTable());

		assertThat(result).isNotNull();
	}

}
