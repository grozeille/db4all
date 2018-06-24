package fr.grozeille.db4all2.table.web.dto;

import com.erudika.para.annotations.Stored;
import fr.grozeille.db4all2.table.model.TableField;
import lombok.Data;

@Data
public class TableUpdateRequest {

    private String name;

    private String comment;

    private String[] tags;

    private TableField[] fields;
}
