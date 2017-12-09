package fr.grozeille.db4all.entity.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityFilterGroup {
    private String operator;

    private EntityFilterCondition[] rules;

    private EntityFilterGroup[] groups;
}
