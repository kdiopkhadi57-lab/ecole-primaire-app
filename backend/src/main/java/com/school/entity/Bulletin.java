package com.school.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "bulletins")
@Data
public class Bulletin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "eleve_id", nullable = false)
    private Eleve eleve;

    private String semestre;
    private String anneeScol;

    private Double totalPoints;
    private Double totalMaxPoints;
    private Double moyenne;
    private Double moyenneClasse;
    private Integer rang;
    private String appreciation;
    private String commentaireEnseignant;

    private LocalDate dateGeneration;
    private boolean signeEnseignant;
    private boolean signeDirecteur;
    private boolean signeParent;
}
