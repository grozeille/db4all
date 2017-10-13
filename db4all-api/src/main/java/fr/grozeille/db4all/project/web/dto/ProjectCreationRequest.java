package fr.grozeille.db4all.project.web.dto;

import lombok.Data;

@Data
public class ProjectCreationRequest {
    private String name;

    private String comment;

    private String[] tags;
}
