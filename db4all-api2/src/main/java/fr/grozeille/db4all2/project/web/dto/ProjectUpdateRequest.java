package fr.grozeille.db4all2.project.web.dto;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

@Data
public class ProjectUpdateRequest {

    @NotNull
    @Min(1)
    private String name;

    private String comment;

    private String[] tags;

    private List<String> members;
}
