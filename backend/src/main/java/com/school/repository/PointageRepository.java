package com.school.repository;

import com.school.entity.Pointage;
import com.school.entity.StatutPresence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PointageRepository extends JpaRepository<Pointage, Long> {

    // Élèves
    List<Pointage> findByEleveIdAndDateBetween(Long eleveId, LocalDate debut, LocalDate fin);
    List<Pointage> findByClasseIdAndDate(Long classeId, LocalDate date);
    List<Pointage> findByClasseIdAndDateBetween(Long classeId, LocalDate debut, LocalDate fin);
    Optional<Pointage> findByEleveIdAndDate(Long eleveId, LocalDate date);

    // Enseignants
    List<Pointage> findByEnseignantIdAndDateBetween(Long enseignantId, LocalDate debut, LocalDate fin);
    Optional<Pointage> findByEnseignantIdAndDate(Long enseignantId, LocalDate date);
    List<Pointage> findByTypePointageAndDateBetween(String typePointage, LocalDate debut, LocalDate fin);

    @Query("SELECT COUNT(p) FROM Pointage p WHERE p.eleve.id = :eleveId AND p.mois = :mois AND p.statut = :statut")
    long countByEleveAndMoisAndStatut(@Param("eleveId") Long eleveId, @Param("mois") String mois, @Param("statut") StatutPresence statut);

    @Query("SELECT COUNT(p) FROM Pointage p WHERE p.enseignant.id = :enseignantId AND p.mois = :mois AND p.statut = :statut")
    long countByEnseignantAndMoisAndStatut(@Param("enseignantId") Long enseignantId, @Param("mois") String mois, @Param("statut") StatutPresence statut);

    @Query("SELECT p FROM Pointage p WHERE p.classe.id = :classeId AND p.mois = :mois AND p.typePointage = 'ELEVE'")
    List<Pointage> findByClasseAndMois(@Param("classeId") Long classeId, @Param("mois") String mois);

    List<Pointage> findByTypePointageAndMois(String typePointage, String mois);
}
