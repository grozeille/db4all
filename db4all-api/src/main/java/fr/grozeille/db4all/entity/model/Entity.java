package fr.grozeille.db4all.entity.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Entity {

    private String id;

    private String name;

    private String comment;

    private String[] tags;
}
