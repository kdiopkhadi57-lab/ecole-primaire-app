package com.school.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "paiements_eleves")
@Data
public class PaiementEleve {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "eleve_id", nullable = false)
    private Eleve eleve;

    @Column(nullable = false)
    private String typePaiement; // INSCRIPTION, SCOLARITE_T1, SCOLARITE_T2, SCOLARITE_T3, CANTINE, TRANSPORT, AUTRE

    private Double montantDu;
    private Double montantPaye;
    private Double montantRestant;

    @Enumerated(EnumType.STRING)
    private StatutPaiement statut; // PAYE, PARTIEL, IMPAYE

    private LocalDate datePaiement;
    private LocalDate dateEcheance;

    private String modePaiement; // ESPECES, VIREMENT, MOBILE_MONEY
    private String referenceRecu;
    private String anneeScol;
    private String trimestre; // T1, T2, T3
    private String notes;

    @ManyToOne
    @JoinColumn(name = "encaisseur_id")
    private User encaisseur; // qui a reçu le paiement
}
