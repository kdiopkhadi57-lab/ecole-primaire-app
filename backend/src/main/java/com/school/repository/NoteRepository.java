package com.school.repository;

import com.school.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByEleveIdAndSemestreAndAnneeScol(Long eleveId, String semestre, String anneeScol);
    List<Note> findByEleveIdAndAnneeScol(Long eleveId, String anneeScol);

    @Query("SELECT n FROM Note n WHERE n.eleve.classe.id = :classeId AND n.semestre = :semestre AND n.anneeScol = :anneeScol")
    List<Note> findByClasseAndSemestreAndAnneeScol(Long classeId, String semestre, String anneeScol);

    Optional<Note> findByEleveIdAndMatiereIdAndSemestreAndAnneeScol(Long eleveId, Long matiereId, String semestre, String anneeScol);

    @Query("SELECT AVG(n.total * 20.0 / n.matiere.noteMax) FROM Note n WHERE n.eleve.classe.id = :classeId AND n.semestre = :semestre AND n.anneeScol = :anneeScol")
    Double avgMoyenneClasse(Long classeId, String semestre, String anneeScol);
}
