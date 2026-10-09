package com.school.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "matieres")
@Data
public class Matiere {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private int noteMax; // e.g. 20, 30, 40, 5
    private int ordre;
}
