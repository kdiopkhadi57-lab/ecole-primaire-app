package com.school.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "configurations_salaires")
@Data
public class ConfigurationSalaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enseignant_id", nullable = false)
    private User enseignant;

    private Double salaireBase;
    private Double primeAnciennete;
    private Double indemnitesTransport;
    private Double indemnitesLogement;
    private Double autresIndemnites;

    private Integer anneesAnciennete;
    private String niveauQualification; // BEPC, BAC, LICENCE, MASTER

    private boolean actif = true;
    private String anneeScol;
}
