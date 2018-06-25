package fr.grozeille.db4all2.project.web.dto;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class ProjectCreationRequest {
    @NotNull
    @Min(1)
    private String name;
}
