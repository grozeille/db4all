package fr.grozeille.db4all2.table.model;

import com.erudika.para.annotations.Stored;
import com.erudika.para.core.Sysprop;
import lombok.Data;

@Data
public class Table extends Sysprop {

    @Stored
    private String comment;

    @Stored
    private TableField[] fields;

    @Stored
    private TableFilter[] filters;

    @Stored
    private TableFilterGroup lastFilter;
}
