package com.school.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "notes")
@Data
public class Note {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "eleve_id", nullable = false)
    private Eleve eleve;

    @ManyToOne
    @JoinColumn(name = "matiere_id", nullable = false)
    private Matiere matiere;

    private Double noteRessources;
    private Double noteCompetences;
    private Double total;
    private String appreciation;

    private String semestre; // S1, S2 or T1, T2, T3
    private String anneeScol;

    // Computed on save
    public void computeTotal() {
        if (noteRessources != null && noteCompetences != null) {
            this.total = noteRessources + noteCompetences;
        }
        if (total != null && matiere != null) {
            this.appreciation = computeAppreciation(total, matiere.getNoteMax());
        }
    }

    private String computeAppreciation(double note, int noteMax) {
        double pct = (note / noteMax) * 100;
        if (pct >= 90) return "Excellent";
        if (pct >= 80) return "Félicitation";
        if (pct >= 70) return "Tableau d'honneur";
        if (pct >= 60) return "Encouragement";
        if (pct >= 50) return "Passable, peut mieux faire";
        return "Insuffisant";
    }
}
