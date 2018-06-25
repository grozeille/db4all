package fr.grozeille.db4all2.table.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TableFilter {
    private String name;

    private TableFilterGroup filter;
}
