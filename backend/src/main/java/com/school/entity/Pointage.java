package com.school.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "pointages")
@Data
public class Pointage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Pour les élèves
    @ManyToOne
    @JoinColumn(name = "eleve_id")
    private Eleve eleve;

    // Pour les enseignants
    @ManyToOne
    @JoinColumn(name = "enseignant_id")
    private User enseignant;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime heureArrivee;
    private LocalTime heureDepart;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPresence statut; // PRESENT, ABSENT, RETARD, CONGE

    private String motifAbsence;
    private boolean justifie = false;
    private String typePointage; // ELEVE / ENSEIGNANT

    @ManyToOne
    @JoinColumn(name = "classe_id")
    private Classe classe;

    private String anneeScol;
    private String mois; // ex: "2024-01"
}
