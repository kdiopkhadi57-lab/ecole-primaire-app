package com.school.repository;

import com.school.entity.SalaireProfesseur;
import com.school.entity.StatutPaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SalaireProfesseurRepository extends JpaRepository<SalaireProfesseur, Long> {

    List<SalaireProfesseur> findByEnseignantId(Long enseignantId);
    List<SalaireProfesseur> findByMois(String mois);
    List<SalaireProfesseur> findByAnneeScol(String anneeScol);
    Optional<SalaireProfesseur> findByEnseignantIdAndMois(Long enseignantId, String mois);

    @Query("SELECT COALESCE(SUM(s.salaireNet), 0) FROM SalaireProfesseur s WHERE s.mois = :mois")
    Double totalMasseSalarialeParMois(@Param("mois") String mois);

    @Query("SELECT COALESCE(SUM(s.salaireNet), 0) FROM SalaireProfesseur s WHERE s.anneeScol = :anneeScol")
    Double totalMasseSalarialeAnnee(@Param("anneeScol") String anneeScol);

    List<SalaireProfesseur> findByMoisAndStatut(String mois, StatutPaiement statut);
}
