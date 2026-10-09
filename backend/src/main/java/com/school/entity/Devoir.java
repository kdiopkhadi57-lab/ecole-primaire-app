package com.school.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "devoirs")
@Data
public class Devoir {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String type; // DEVOIR ou COMPOSITION

    private LocalDate datePrevue;
    private String anneeScol;

    @ManyToOne
    @JoinColumn(name = "classe_id", nullable = false)
    @JsonIgnoreProperties({"eleves", "enseignants"})
    private Classe classe;

    @ManyToOne
    @JoinColumn(name = "matiere_id")
    @JsonIgnoreProperties({"notes"})
    private Matiere matiere;
}
