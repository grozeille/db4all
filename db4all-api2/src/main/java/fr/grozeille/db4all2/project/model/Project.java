package fr.grozeille.db4all2.project.model;


import com.erudika.para.core.Sysprop;
import lombok.Data;

import java.util.List;

@Data
public class Project extends Sysprop {

    private String comment;

    private List<String> members;
}
