package fr.grozeille.db4all.project.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "PROJECT")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Project {
    @Id
    @Column(name = "ID")
    private String id;

    @Column(name = "NAME")
    private String name;

    @Column(name = "HIVE_DB")
    private String hiveDatabase;

    @Column(name = "HDFS_WORKING_DIR")
    private String hdfsWorkingDirectory;

    @ManyToMany
    @JoinTable(
            name="PROJECT_USER",
            joinColumns=@JoinColumn(name="PROJECT_ID", referencedColumnName="ID"),
            inverseJoinColumns=@JoinColumn(name="USER_LOGIN", referencedColumnName="LOGIN"))
    private List<ProjectUser> members;
}
