package fr.grozeille.db4all.project.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Project {
    private String id;

    private String name;

    private String comment;

    private String[] tags;

    private List<String> members;
}
