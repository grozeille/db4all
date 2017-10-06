package fr.grozeille.db4all.user.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "USER")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserWithProject {
    @Id
    @Column(name = "LOGIN")
    private String login;

    @Column(name = "LAST_LOGIN")
    private LocalDateTime lastLogin;

    @ManyToOne(fetch=FetchType.EAGER)
    @JoinColumn(name="LAST_PROJECT")
    private UserProject lastProject;

    @ManyToMany
    @JoinTable(
            name="PROJECT_USER",
            joinColumns=@JoinColumn(name="USER_LOGIN", referencedColumnName="LOGIN"),
            inverseJoinColumns=@JoinColumn(name="PROJECT_ID", referencedColumnName="ID"))
    private List<UserProject> projects;
}
