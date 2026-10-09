package com.school.entity;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "eleves")
@Data
public class Eleve {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false)
    private String nom;

    private LocalDate dateNaissance;
    private String lieuNaissance;
    private String sexe; // M / F
    private String nomPere;
    private String nomMere;
    private String telephoneParent;
    private String emailParent; // ← pour les notifications
    private String adresse;

    @ManyToOne
    @JoinColumn(name = "classe_id", nullable = false)
    @JsonIgnoreProperties({"eleves", "enseignants"})
    private Classe classe;

    private String anneeScol;
    private boolean actif = true;
    private String matricule;

    // ── École d'origine (optionnel) ─────────────────────────────────────
    private String ecoleOrigine;
    private String classeAnneePrecedente;

    @Column(length = 2000)
    private String notesOrigineS1;

    @Column(length = 2000)
    private String notesOrigineS2;

    // ── Frais d'inscription et scolarité ───────────────────────────────────
    private Double montantInscription = 0.0;
    private Double montantMensuel = 0.0;
    private Double sommeVerseJuillet = 0.0;
}
