package com.school.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "salaires_professeurs")
@Data
public class SalaireProfesseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enseignant_id", nullable = false)
    private User enseignant;

    private String mois;      // "2024-01"
    private String anneeScol;

    // Composantes du salaire
    private Double salaireBrut;
    private Double salaireBase;
    private Double primeAnciennete;
    private Double primeSurperfomance;
    private Double indemnitesTransport;
    private Double indemnitesLogement;
    private Double autresIndemnites;

    // Retenues
    private Double cotisationIPRES;   // retraite ~8.4%
    private Double cotisationCSS;     // sécu sociale ~7%
    private Double impotSurRevenu;    // IRPP
    private Double autresRetenues;

    // Absences déduites
    private Integer joursAbsenceNonJustifie;
    private Double deductionAbsences;

    // Net
    private Double salaireNet;

    @Enumerated(EnumType.STRING)
    private StatutPaiement statut;

    private LocalDate datePaiement;
    private String modePaiement;
    private String referenceVirement;
    private String observations;

    @ManyToOne
    @JoinColumn(name = "validateur_id")
    private User validateur;

    private LocalDate dateValidation;
    private boolean valide = false;
}
