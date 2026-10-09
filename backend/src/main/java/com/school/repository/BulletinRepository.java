package com.school.repository;

import com.school.entity.Bulletin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BulletinRepository extends JpaRepository<Bulletin, Long> {
    List<Bulletin> findByEleveIdAndAnneeScol(Long eleveId, String anneeScol);
    Optional<Bulletin> findByEleveIdAndSemestreAndAnneeScol(Long eleveId, String semestre, String anneeScol);
    List<Bulletin> findByEleveClasseIdAndSemestreAndAnneeScol(Long classeId, String semestre, String anneeScol);
}
