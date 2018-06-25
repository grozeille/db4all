package fr.grozeille.db4all2.table.web.dto;

import com.erudika.para.annotations.Stored;
import fr.grozeille.db4all2.table.model.TableField;
import fr.grozeille.db4all2.table.model.TableFilter;
import fr.grozeille.db4all2.table.model.TableFilterGroup;
import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class TableUpdateRequest {

    @NotNull
    @Min(1)
    private String name;

    private String comment;

    private String[] tags;

    private TableField[] fields;

    private TableFilter[] filters;

    private TableFilterGroup lastFilter;
}
