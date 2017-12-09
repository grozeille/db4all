package fr.grozeille.db4all.entity.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityFilterCondition {
    private EntityField field;

    private String condition;

    private String data;
}
