package com.school.repository;

import com.school.entity.PaiementEleve;
import com.school.entity.StatutPaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PaiementEleveRepository extends JpaRepository<PaiementEleve, Long> {

    List<PaiementEleve> findByEleveId(Long eleveId);
    List<PaiementEleve> findByEleveIdAndAnneeScol(Long eleveId, String anneeScol);
    List<PaiementEleve> findByAnneeScol(String anneeScol);
    List<PaiementEleve> findByStatut(StatutPaiement statut);
    List<PaiementEleve> findByEleveClasseIdAndAnneeScol(Long classeId, String anneeScol);

    @Query("SELECT COALESCE(SUM(p.montantPaye), 0) FROM PaiementEleve p WHERE p.anneeScol = :anneeScol")
    Double totalEncaisseAnnee(@Param("anneeScol") String anneeScol);

    @Query("SELECT COALESCE(SUM(p.montantRestant), 0) FROM PaiementEleve p WHERE p.anneeScol = :anneeScol AND p.statut <> 'PAYE'")
    Double totalRestantAnnee(@Param("anneeScol") String anneeScol);

    @Query("SELECT COUNT(DISTINCT p.eleve.id) FROM PaiementEleve p WHERE p.anneeScol = :anneeScol AND p.statut = 'IMPAYE'")
    long countElevesImpayes(@Param("anneeScol") String anneeScol);

    @Query("SELECT p FROM PaiementEleve p WHERE p.eleve.classe.id = :classeId AND p.anneeScol = :anneeScol AND p.statut <> 'PAYE'")
    List<PaiementEleve> findImapyesByClasse(@Param("classeId") Long classeId, @Param("anneeScol") String anneeScol);
}
