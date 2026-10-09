package com.school.controller;

import com.school.entity.*;
import com.school.repository.*;
import com.school.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepo;
    private final EleveRepository eleveRepo;
    private final PaiementEleveRepository paiementRepo;

    // ── Lister ────────────────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','SECRETAIRE')")
    public List<Notification> getAll(@RequestParam(required = false) String anneeScol) {
        if (anneeScol != null) return notificationRepo.findByAnneeScol(anneeScol);
        return notificationRepo.findAllByOrderByDateCreationDesc();
    }

    @GetMapping("/eleve/{eleveId}")
    public List<Notification> getByEleve(@PathVariable Long eleveId) {
        return notificationRepo.findByEleveId(eleveId);
    }

    // ── Stats ─────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','SECRETAIRE')")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Notification> all = notificationRepo.findAll();
        return ResponseEntity.ok(Map.of(
            "total",     all.size(),
            "envoyes",   all.stream().filter(n -> "ENVOYE".equals(n.getStatut())).count(),
            "echecs",    all.stream().filter(n -> "ECHEC".equals(n.getStatut())).count(),
            "bulletins", all.stream().filter(n -> TypeNotification.BULLETIN.equals(n.getType())).count(),
            "paiements", all.stream().filter(n -> TypeNotification.PAIEMENT_FIN_MOIS.equals(n.getType())).count()
        ));
    }

    // ── Bulletins ─────────────────────────────────────────────────────────
    @PostMapping("/bulletins")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','SECRETAIRE')")
    public ResponseEntity<Map<String, Object>> notifierBulletins(@RequestBody Map<String, Object> body) {
        Long classeId = Long.valueOf(body.get("classeId").toString());
        String semestre = (String) body.get("semestre");
        String anneeScol = (String) body.get("anneeScol");
        List<Notification> notifs = notificationService.notifierBulletins(classeId, semestre, anneeScol);
        long envoyes = notifs.stream().filter(n -> "ENVOYE".equals(n.getStatut())).count();
        long echecs  = notifs.stream().filter(n -> "ECHEC".equals(n.getStatut())).count();
        return ResponseEntity.ok(Map.of(
            "total", notifs.size(), "envoyes", envoyes, "echecs", echecs,
            "message", envoyes + " email(s) envoyé(s) avec succès sur " + notifs.size() + " parents"
        ));
    }

    // ── Paiements fin de mois ─────────────────────────────────────────────
    @PostMapping("/paiements-fin-mois")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR','SECRETAIRE')")
    public ResponseEntity<Map<String, Object>> notifierPaiements(@RequestBody Map<String, Object> body) {
        String mois = (String) body.get("mois");
        String anneeScol = (String) body.get("anneeScol");
        // Trouver les élèves avec des paiements non soldés
        List<Eleve> elevesImpayes = paiementRepo.findAll().stream()
            .filter(p -> anneeScol.equals(p.getAnneeScol()))
            .filter(p -> p.getStatut() == StatutPaiement.IMPAYE || p.getStatut() == StatutPaiement.PARTIEL)
            .map(p -> p.getEleve())
            .filter(e -> e != null && e.isActif())
            .distinct()
            .toList();
        List<Notification> notifs = notificationService.notifierPaiementsFinMois(elevesImpayes, mois, anneeScol);
        long envoyes = notifs.stream().filter(n -> "ENVOYE".equals(n.getStatut())).count();
        return ResponseEntity.ok(Map.of(
            "elevesImpayes", elevesImpayes.size(),
            "total", notifs.size(), "envoyes", envoyes,
            "message", envoyes + " rappel(s) envoyé(s)"
        ));
    }

    // ── Message général ───────────────────────────────────────────────────
    @PostMapping("/general")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR')")
    public ResponseEntity<Map<String, Object>> notifierGeneral(@RequestBody Map<String, Object> body) {
        String sujet    = (String) body.get("sujet");
        String message  = (String) body.get("message");
        String anneeScol = (String) body.get("anneeScol");
        List<Notification> notifs = notificationService.notifierGeneral(sujet, message, anneeScol);
        long envoyes = notifs.stream().filter(n -> "ENVOYE".equals(n.getStatut())).count();
        return ResponseEntity.ok(Map.of(
            "total", notifs.size(), "envoyes", envoyes,
            "message", envoyes + " notification(s) envoyée(s)"
        ));
    }
}
