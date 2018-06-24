package fr.grozeille.db4all2.table.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TableField {
    private int fieldId;

    private String name;

    private int width;

    private TableFieldType type;

    private String format;

    private String entityId;

    private int entityField;

    private int maxLength;

    private TableLinkType linkType;
}
