package fr.grozeille.db4all.entity.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityField {
    private int fieldId;

    private String name;

    private int width;

    private EntityFieldType type;
}
