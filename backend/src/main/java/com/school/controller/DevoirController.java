package com.school.controller;

import com.school.entity.Devoir;
import com.school.repository.ClasseRepository;
import com.school.repository.DevoirRepository;
import com.school.repository.MatiereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devoirs")
@RequiredArgsConstructor
public class DevoirController {
    private final DevoirRepository devoirRepo;
    private final ClasseRepository classeRepo;
    private final MatiereRepository matiereRepo;

    @GetMapping
    public List<Devoir> getAll(@RequestParam(required = false) Long classeId,
                               @RequestParam(required = false) String anneeScol) {
        if (classeId != null && anneeScol != null) {
            return devoirRepo.findByClasseIdAndAnneeScolOrderByDatePrevueAsc(classeId, anneeScol);
        }
        return devoirRepo.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTEUR', 'ENSEIGNANT')")
    public Devoir create(@RequestBody Map<String, Object> body) {
        Devoir devoir = new Devoir();
        devoir.setTitre((String) body.get("titre"));
        devoir.setDescription((String) body.get("description"));
        devoir.setType((String) body.get("type"));
        devoir.setAnneeScol((String) body.get("anneeScol"));
        if (body.get("datePrevue") != null) {
            devoir.setDatePrevue(java.time.LocalDate.parse(body.get("datePrevue").toString()));
        }
        Long classeId = Long.valueOf(body.get("classeId").toString());
        devoir.setClasse(classeRepo.findById(classeId).orElseThrow());
        if (body.get("matiereId") != null) {
            devoir.setMatiere(matiereRepo.findById(Long.valueOf(body.get("matiereId").toString())).orElseThrow());
        }
        return devoirRepo.save(devoir);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTEUR', 'ENSEIGNANT')")
    public void delete(@PathVariable Long id) {
        devoirRepo.deleteById(id);
    }
}
