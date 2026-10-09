package com.school.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "classes")
@Data
public class Classe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nom; // CI, CP, CE1, CE2, CM1, CM2

    private int effectifs;

    @JsonIgnore
    @OneToMany(mappedBy = "classe")
    private List<Eleve> eleves;

    @JsonIgnore
    @OneToMany(mappedBy = "classe")
    private List<User> enseignants;
}
