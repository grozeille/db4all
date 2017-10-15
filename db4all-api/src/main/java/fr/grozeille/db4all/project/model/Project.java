package fr.grozeille.db4all.project.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Project {

    @Id
    private String id;

    private String name;

    private String comment;

    private String[] tags;

    private List<String> members;
}
