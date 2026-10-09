package com.school.controller;

import com.school.entity.*;
import com.school.repository.*;
import com.school.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bulletins")
@RequiredArgsConstructor
public class BulletinController {

    private final BulletinRepository bulletinRepo;
    private final EleveRepository eleveRepo;
    private final NoteRepository noteRepo;
    private final MatiereRepository matiereRepo;
    private final NotificationService notificationService;

    @GetMapping
    public List<Bulletin> getAll(@RequestParam(required = false) Long eleveId,
                                  @RequestParam(required = false) Long classeId,
                                  @RequestParam(required = false) String semestre,
                                  @RequestParam(required = false) String anneeScol) {
        if (eleveId != null && anneeScol != null)
            return bulletinRepo.findByEleveIdAndAnneeScol(eleveId, anneeScol);
        if (classeId != null && semestre != null && anneeScol != null)
            return bulletinRepo.findByEleveClasseIdAndSemestreAndAnneeScol(classeId, semestre, anneeScol);
        return bulletinRepo.findAll();
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateBulletins(@RequestBody Map<String, Object> body) {
        Long classeId   = Long.valueOf(body.get("classeId").toString());
        String semestre  = (String) body.get("semestre");
        String anneeScol = (String) body.get("anneeScol");
        // Optionnel : envoyer emails aux parents après génération (true par défaut)
        boolean notifierParents = !Boolean.FALSE.equals(body.get("notifierParents"));

        List<Eleve> eleves = eleveRepo.findByClasseIdAndActif(classeId, true);
        List<Note> allNotes = noteRepo.findByClasseAndSemestreAndAnneeScol(classeId, semestre, anneeScol);
        List<Matiere> matieres = matiereRepo.findAll();
        int totalMax = matieres.stream().mapToInt(Matiere::getNoteMax).sum();

        Map<Long, Double> moyennes = new HashMap<>();
        for (Eleve eleve : eleves) {
            List<Note> en = allNotes.stream().filter(n -> n.getEleve().getId().equals(eleve.getId())).toList();
            double total = en.stream().mapToDouble(n -> n.getTotal() != null ? n.getTotal() : 0).sum();
            moyennes.put(eleve.getId(), totalMax > 0 ? Math.round((total * 20.0 / totalMax) * 100.0) / 100.0 : 0);
        }

        List<Map.Entry<Long, Double>> sorted = new ArrayList<>(moyennes.entrySet());
        sorted.sort((a, b2) -> Double.compare(b2.getValue(), a.getValue()));
        Map<Long, Integer> rangs = new LinkedHashMap<>();
        for (int i = 0; i < sorted.size(); i++) rangs.put(sorted.get(i).getKey(), i + 1);

        double moyenneClasse = Math.round(moyennes.values().stream().mapToDouble(v -> v).average().orElse(0) * 100.0) / 100.0;

        for (Eleve eleve : eleves) {
            Bulletin b = bulletinRepo.findByEleveIdAndSemestreAndAnneeScol(eleve.getId(), semestre, anneeScol).orElse(new Bulletin());
            b.setEleve(eleve); b.setSemestre(semestre); b.setAnneeScol(anneeScol);
            double moy = moyennes.getOrDefault(eleve.getId(), 0.0);
            b.setMoyenne(moy); b.setMoyenneClasse(moyenneClasse);
            b.setRang(rangs.getOrDefault(eleve.getId(), 0));
            b.setAppreciation(getAppreciation(moy));
            b.setDateGeneration(LocalDate.now());
            bulletinRepo.save(b);
        }

        // Envoi automatique des notifications aux parents
        int emailsEnvoyes = 0;
        if (notifierParents) {
            List<Notification> notifs = notificationService.notifierBulletins(classeId, semestre, anneeScol);
            emailsEnvoyes = (int) notifs.stream().filter(n -> "ENVOYE".equals(n.getStatut())).count();
        }

        return ResponseEntity.ok(Map.of(
            "generated", eleves.size(),
            "moyenneClasse", moyenneClasse,
            "emailsEnvoyes", emailsEnvoyes,
            "message", eleves.size() + " bulletin(s) générés" +
                (notifierParents ? ", " + emailsEnvoyes + " email(s) envoyé(s) aux parents" : "")
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bulletin> getById(@PathVariable Long id) {
        return bulletinRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<Map<String, Object>> getBulletinDetails(@PathVariable Long id) {
        return bulletinRepo.findById(id).map(b -> {
            List<Note> notes = noteRepo.findByEleveIdAndSemestreAndAnneeScol(b.getEleve().getId(), b.getSemestre(), b.getAnneeScol());
            return ResponseEntity.ok(Map.of("bulletin", b, "notes", notes));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/signer")
    public ResponseEntity<Bulletin> signer(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return bulletinRepo.findById(id).map(b -> {
            if (Boolean.TRUE.equals(body.get("enseignant"))) b.setSigneEnseignant(true);
            if (Boolean.TRUE.equals(body.get("directeur")))  b.setSigneDirecteur(true);
            if (Boolean.TRUE.equals(body.get("parent")))     b.setSigneParent(true);
            return ResponseEntity.ok(bulletinRepo.save(b));
        }).orElse(ResponseEntity.notFound().build());
    }

    private String getAppreciation(double m) {
        if (m >= 18) return "Excellent"; if (m >= 16) return "Très Bien"; if (m >= 14) return "Bien";
        if (m >= 12) return "Assez Bien"; if (m >= 10) return "Passable"; return "Insuffisant";
    }
}
