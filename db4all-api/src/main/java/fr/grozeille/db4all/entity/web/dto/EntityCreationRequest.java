package fr.grozeille.db4all.entity.web.dto;

import fr.grozeille.db4all.entity.model.EntityField;
import lombok.Data;

@Data
public class EntityCreationRequest {
    private String name;

    private String comment;

    private String[] tags;

    private EntityField[] fields;
}
