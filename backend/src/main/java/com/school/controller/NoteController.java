package com.school.controller;

import com.school.entity.*;
import com.school.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.InputStream;
import java.util.*;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteRepository noteRepo;
    private final EleveRepository eleveRepo;
    private final MatiereRepository matiereRepo;

    @GetMapping
    public List<Note> getNotes(@RequestParam Long eleveId,
                                @RequestParam String semestre,
                                @RequestParam String anneeScol) {
        return noteRepo.findByEleveIdAndSemestreAndAnneeScol(eleveId, semestre, anneeScol);
    }

    @GetMapping("/classe")
    public List<Note> getNotesByClasse(@RequestParam Long classeId,
                                        @RequestParam String semestre,
                                        @RequestParam String anneeScol) {
        return noteRepo.findByClasseAndSemestreAndAnneeScol(classeId, semestre, anneeScol);
    }

    @PostMapping
    public ResponseEntity<Note> saveNote(@RequestBody Map<String, Object> body) {
        Long eleveId = Long.valueOf(body.get("eleveId").toString());
        Long matiereId = Long.valueOf(body.get("matiereId").toString());
        String semestre = (String) body.get("semestre");
        String anneeScol = (String) body.get("anneeScol");

        Note note = noteRepo.findByEleveIdAndMatiereIdAndSemestreAndAnneeScol(
                eleveId, matiereId, semestre, anneeScol).orElse(new Note());

        note.setEleve(eleveRepo.findById(eleveId).orElseThrow());
        note.setMatiere(matiereRepo.findById(matiereId).orElseThrow());
        note.setSemestre(semestre);
        note.setAnneeScol(anneeScol);
        if (body.get("noteRessources") != null)
            note.setNoteRessources(Double.valueOf(body.get("noteRessources").toString()));
        if (body.get("noteCompetences") != null)
            note.setNoteCompetences(Double.valueOf(body.get("noteCompetences").toString()));
        note.computeTotal();

        return ResponseEntity.ok(noteRepo.save(note));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<Note>> saveBatch(@RequestBody List<Map<String, Object>> notes) {
        List<Note> saved = new ArrayList<>();
        for (Map<String, Object> body : notes) {
            Long eleveId = Long.valueOf(body.get("eleveId").toString());
            Long matiereId = Long.valueOf(body.get("matiereId").toString());
            String semestre = (String) body.get("semestre");
            String anneeScol = (String) body.get("anneeScol");

            Note note = noteRepo.findByEleveIdAndMatiereIdAndSemestreAndAnneeScol(
                    eleveId, matiereId, semestre, anneeScol).orElse(new Note());

            note.setEleve(eleveRepo.findById(eleveId).orElseThrow());
            note.setMatiere(matiereRepo.findById(matiereId).orElseThrow());
            note.setSemestre(semestre);
            note.setAnneeScol(anneeScol);
            if (body.get("noteRessources") != null)
                note.setNoteRessources(Double.valueOf(body.get("noteRessources").toString()));
            if (body.get("noteCompetences") != null)
                note.setNoteCompetences(Double.valueOf(body.get("noteCompetences").toString()));
            note.computeTotal();
            saved.add(noteRepo.save(note));
        }
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("classeId") Long classeId,
            @RequestParam("semestre") String semestre,
            @RequestParam("anneeScol") String anneeScol) {
        List<String> errors = new ArrayList<>();
        int savedCount = 0;
        List<Matiere> matieres = matiereRepo.findAll();
        List<Eleve> eleves = eleveRepo.findByClasseIdAndActif(classeId, true);

        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            Row header = sheet.getRow(0);
            // Expected columns: Matricule, Prenom, Nom, then for each matiere: Ressources, Compétences
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String matricule = getCellValue(row, 0);
                Eleve eleve = eleves.stream()
                        .filter(e -> e.getMatricule().equals(matricule))
                        .findFirst().orElse(null);
                if (eleve == null) {
                    errors.add("Ligne " + (i+1) + ": Élève non trouvé: " + matricule);
                    continue;
                }
                for (int j = 0; j < matieres.size(); j++) {
                    int colR = 3 + j * 2;
                    int colC = 4 + j * 2;
                    String vR = getCellValue(row, colR);
                    String vC = getCellValue(row, colC);
                    if (vR == null && vC == null) continue;
                    try {
                        Matiere mat = matieres.get(j);
                        Note note = noteRepo.findByEleveIdAndMatiereIdAndSemestreAndAnneeScol(
                                eleve.getId(), mat.getId(), semestre, anneeScol).orElse(new Note());
                        note.setEleve(eleve);
                        note.setMatiere(mat);
                        note.setSemestre(semestre);
                        note.setAnneeScol(anneeScol);
                        if (vR != null) note.setNoteRessources(Double.parseDouble(vR));
                        if (vC != null) note.setNoteCompetences(Double.parseDouble(vC));
                        note.computeTotal();
                        noteRepo.save(note);
                        savedCount++;
                    } catch (Exception ex) {
                        errors.add("Ligne " + (i+1) + " Matière " + j + ": " + ex.getMessage());
                    }
                }
            }
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
        return ResponseEntity.ok(Map.of("saved", savedCount, "errors", errors));
    }

    private String getCellValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf(cell.getNumericCellValue());
            default -> null;
        };
    }
}
