package fr.grozeille.db4all.admin.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "ADMIN")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminUser {
    @Id
    @Column(name = "LOGIN")
    private String login;
}
