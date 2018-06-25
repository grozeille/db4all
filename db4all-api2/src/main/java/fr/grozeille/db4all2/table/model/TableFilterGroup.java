package fr.grozeille.db4all2.table.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TableFilterGroup {
    private String operator;

    private TableFilterCondition[] rules;

    private TableFilterGroup[] groups;
}
