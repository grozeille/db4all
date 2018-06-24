package fr.grozeille.db4all2.table.model;

import com.erudika.para.annotations.Stored;
import com.erudika.para.core.Sysprop;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class TableData extends Sysprop {

    public TableData(){
        super();
        this.setIndexed(false);
    }

    @Stored
    private List<Map<String, Object>> data;
}
