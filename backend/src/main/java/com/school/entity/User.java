package com.school.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String prenom;
    private String nom;
    private String email;
    private String telephone;
    private LocalDate dateNaissance;

    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean actif = true;

    @ManyToOne
    @JoinColumn(name = "classe_id")
    @JsonIgnoreProperties({"eleves", "enseignants"})
    private Classe classe;

    @ManyToOne
    @JoinColumn(name = "parent_eleve_id")
    @JsonIgnoreProperties({"classe"})
    private Eleve parentEleve;
}
