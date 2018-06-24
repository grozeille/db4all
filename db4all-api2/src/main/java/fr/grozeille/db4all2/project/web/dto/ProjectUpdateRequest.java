package fr.grozeille.db4all2.project.web.dto;

import lombok.Data;

import java.util.List;

@Data
public class ProjectUpdateRequest {

    private String name;

    private String comment;

    private String[] tags;

    private List<String> members;
}
