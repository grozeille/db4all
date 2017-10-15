package fr.grozeille.db4all.entity.web.dto;

import lombok.Data;

@Data
public class EntityCreationRequest {
    private String name;

    private String comment;

    private String[] tags;
}
