package com.school.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TypeNotification type;

    private String sujet;

    @Column(length = 2000)
    private String message;

    private String destinatireEmail;  // destinataire (sans 'a' - nom de champ unifié)
    private String destinatireNom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "eleve_id")
    @JsonIgnoreProperties({"classe", "eleves", "enseignants"})
    private Eleve eleve;

    private boolean envoyeEmail;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateCreation;
    private String statut; // ENVOYE, ECHEC, EN_ATTENTE

    private String anneeScol;
    private String mois;
    private String semestre;

    @PrePersist
    public void prePersist() {
        dateCreation = LocalDateTime.now();
        if (statut == null) statut = "EN_ATTENTE";
    }
}
