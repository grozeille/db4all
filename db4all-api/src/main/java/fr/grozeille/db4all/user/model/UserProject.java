package fr.grozeille.db4all.user.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "PROJECT")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProject {
    @Id
    @Column(name = "ID")
    private String id;

    @Column(name = "NAME")
    private String name;

    @Column(name = "HIVE_DB")
    private String hiveDatabase;

    @Column(name = "HDFS_WORKING_DIR")
    private String hdfsWorkingDirectory;

}
