package com.school.repository;

import com.school.entity.Eleve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface EleveRepository extends JpaRepository<Eleve, Long> {
    List<Eleve> findByClasseIdAndActif(Long classeId, boolean actif);
    List<Eleve> findByAnneeScol(String anneeScol);
    Optional<Eleve> findByMatricule(String matricule);

    @Query("SELECT COUNT(e) FROM Eleve e WHERE e.classe.id = :classeId AND e.actif = true")
    long countActiveByClasse(Long classeId);
}
