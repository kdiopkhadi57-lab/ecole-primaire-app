package com.school.controller;

import com.school.entity.*;
import com.school.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/pointages")
@RequiredArgsConstructor
public class PointageController {

    private final PointageRepository pointageRepo;
    private final EleveRepository eleveRepo;
    private final UserRepository userRepo;
    private final ClasseRepository classeRepo;

    // ── Pointage élèves par classe et date ────────────────────────────────
    @GetMapping("/eleves/classe/{classeId}")
    public ResponseEntity<List<Map<String, Object>>> getPointageClasse(
            @PathVariable Long classeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<Eleve> eleves = eleveRepo.findByClasseIdAndActif(classeId, true);
        List<Pointage> pointages = pointageRepo.findByClasseIdAndDate(classeId, date);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Eleve e : eleves) {
            Pointage p = pointages.stream()
                    .filter(pt -> pt.getEleve() != null && pt.getEleve().getId().equals(e.getId()))
                    .findFirst().orElse(null);
            Map<String, Object> row = new HashMap<>();
            row.put("eleveId", e.getId());
            row.put("prenom", e.getPrenom());
            row.put("nom", e.getNom());
            row.put("matricule", e.getMatricule());
            row.put("pointageId", p != null ? p.getId() : null);
            row.put("statut", p != null ? p.getStatut().name() : "PRESENT");
            row.put("motifAbsence", p != null ? p.getMotifAbsence() : null);
            row.put("justifie", p != null && p.isJustifie());
            row.put("heureArrivee", p != null ? p.getHeureArrivee() : null);
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    // ── Sauvegarder pointage en lot ────────────────────────────────────────
    @PostMapping("/eleves/batch")
    public ResponseEntity<Map<String, Object>> savePointageBatch(
            @RequestBody Map<String, Object> body) {

        Long classeId = Long.valueOf(body.get("classeId").toString());
        LocalDate date = LocalDate.parse((String) body.get("date"));
        String mois = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String anneeScol = (String) body.get("anneeScol");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> pointages = (List<Map<String, Object>>) body.get("pointages");
        Classe classe = classeRepo.findById(classeId).orElseThrow();

        int saved = 0;
        for (Map<String, Object> pt : pointages) {
            Long eleveId = Long.valueOf(pt.get("eleveId").toString());
            StatutPresence statut = StatutPresence.valueOf((String) pt.get("statut"));

            Pointage pointage = pointageRepo.findByEleveIdAndDate(eleveId, date)
                    .orElse(new Pointage());
            pointage.setEleve(eleveRepo.findById(eleveId).orElseThrow());
            pointage.setDate(date);
            pointage.setStatut(statut);
            pointage.setClasse(classe);
            pointage.setTypePointage("ELEVE");
            pointage.setMois(mois);
            pointage.setAnneeScol(anneeScol);
            if (pt.get("motifAbsence") != null)
                pointage.setMotifAbsence((String) pt.get("motifAbsence"));
            if (pt.get("justifie") != null)
                pointage.setJustifie((Boolean) pt.get("justifie"));
            pointageRepo.save(pointage);
            saved++;
        }
        return ResponseEntity.ok(Map.of("saved", saved, "date", date.toString()));
    }

    // ── Statistiques mensuelles élève ──────────────────────────────────────
    @GetMapping("/eleves/{eleveId}/stats")
    public ResponseEntity<Map<String, Object>> statsEleve(
            @PathVariable Long eleveId,
            @RequestParam String mois) {

        long presents = pointageRepo.countByEleveAndMoisAndStatut(eleveId, mois, StatutPresence.PRESENT);
        long absents  = pointageRepo.countByEleveAndMoisAndStatut(eleveId, mois, StatutPresence.ABSENT);
        long retards  = pointageRepo.countByEleveAndMoisAndStatut(eleveId, mois, StatutPresence.RETARD);
        long conges   = pointageRepo.countByEleveAndMoisAndStatut(eleveId, mois, StatutPresence.CONGE);

        return ResponseEntity.ok(Map.of(
                "presents", presents, "absents", absents,
                "retards", retards,   "conges", conges,
                "total", presents + absents + retards + conges
        ));
    }

    // ── Pointage historique élève ──────────────────────────────────────────
    @GetMapping("/eleves/{eleveId}/historique")
    public List<Pointage> historiqueEleve(
            @PathVariable Long eleveId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return pointageRepo.findByEleveIdAndDateBetween(eleveId, debut, fin);
    }

    // ── Rapport mensuel classe ──────────────────────────────────────────────
    @GetMapping("/eleves/rapport/classe/{classeId}")
    public ResponseEntity<List<Map<String, Object>>> rapportMensuelClasse(
            @PathVariable Long classeId,
            @RequestParam String mois) {

        List<Eleve> eleves = eleveRepo.findByClasseIdAndActif(classeId, true);
        List<Map<String, Object>> rapport = new ArrayList<>();

        for (Eleve e : eleves) {
            long presents = pointageRepo.countByEleveAndMoisAndStatut(e.getId(), mois, StatutPresence.PRESENT);
            long absents  = pointageRepo.countByEleveAndMoisAndStatut(e.getId(), mois, StatutPresence.ABSENT);
            long retards  = pointageRepo.countByEleveAndMoisAndStatut(e.getId(), mois, StatutPresence.RETARD);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("eleveId", e.getId());
            row.put("prenom", e.getPrenom());
            row.put("nom", e.getNom());
            row.put("matricule", e.getMatricule());
            row.put("presents", presents);
            row.put("absents", absents);
            row.put("retards", retards);
            row.put("total", presents + absents + retards);
            rapport.add(row);
        }
        return ResponseEntity.ok(rapport);
    }

    // ── Pointage enseignants ───────────────────────────────────────────────
    @GetMapping("/enseignants")
    public ResponseEntity<List<Map<String, Object>>> getPointageEnseignants(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<com.school.entity.User> enseignants = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.ENSEIGNANT && u.isActif())
                .toList();
        List<Pointage> pointages = pointageRepo.findByTypePointageAndDateBetween(
                "ENSEIGNANT", date, date);

        List<Map<String, Object>> result = new ArrayList<>();
        for (com.school.entity.User u : enseignants) {
            Pointage p = pointages.stream()
                    .filter(pt -> pt.getEnseignant() != null && pt.getEnseignant().getId().equals(u.getId()))
                    .findFirst().orElse(null);
            Map<String, Object> row = new HashMap<>();
            row.put("enseignantId", u.getId());
            row.put("prenom", u.getPrenom());
            row.put("nom", u.getNom());
            row.put("classe", u.getClasse() != null ? u.getClasse().getNom() : "—");
            row.put("pointageId", p != null ? p.getId() : null);
            row.put("statut", p != null ? p.getStatut().name() : "PRESENT");
            row.put("heureArrivee", p != null ? p.getHeureArrivee() : null);
            row.put("heureDepart", p != null ? p.getHeureDepart() : null);
            row.put("motifAbsence", p != null ? p.getMotifAbsence() : null);
            row.put("justifie", p != null && p.isJustifie());
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/enseignants/batch")
    public ResponseEntity<Map<String, Object>> savePointageEnseignants(
            @RequestBody Map<String, Object> body) {

        LocalDate date = LocalDate.parse((String) body.get("date"));
        String mois = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String anneeScol = (String) body.get("anneeScol");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> pointages = (List<Map<String, Object>>) body.get("pointages");

        int saved = 0;
        for (Map<String, Object> pt : pointages) {
            Long enseignantId = Long.valueOf(pt.get("enseignantId").toString());
            StatutPresence statut = StatutPresence.valueOf((String) pt.get("statut"));

            Pointage pointage = pointageRepo.findByEnseignantIdAndDate(enseignantId, date)
                    .orElse(new Pointage());
            pointage.setEnseignant(userRepo.findById(enseignantId).orElseThrow());
            pointage.setDate(date);
            pointage.setStatut(statut);
            pointage.setTypePointage("ENSEIGNANT");
            pointage.setMois(mois);
            pointage.setAnneeScol(anneeScol);
            if (pt.get("motifAbsence") != null)
                pointage.setMotifAbsence((String) pt.get("motifAbsence"));
            if (pt.get("justifie") != null)
                pointage.setJustifie((Boolean) pt.get("justifie"));
            if (pt.get("heureArrivee") != null) {
                pointage.setHeureArrivee(java.time.LocalTime.parse((String) pt.get("heureArrivee")));
            }
            if (pt.get("heureDepart") != null) {
                pointage.setHeureDepart(java.time.LocalTime.parse((String) pt.get("heureDepart")));
            }
            pointageRepo.save(pointage);
            saved++;
        }
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    @GetMapping("/enseignants/{enseignantId}/stats")
    public ResponseEntity<Map<String, Object>> statsEnseignant(
            @PathVariable Long enseignantId,
            @RequestParam String mois) {

        long presents = pointageRepo.countByEnseignantAndMoisAndStatut(enseignantId, mois, StatutPresence.PRESENT);
        long absents  = pointageRepo.countByEnseignantAndMoisAndStatut(enseignantId, mois, StatutPresence.ABSENT);
        long retards  = pointageRepo.countByEnseignantAndMoisAndStatut(enseignantId, mois, StatutPresence.RETARD);
        long conges   = pointageRepo.countByEnseignantAndMoisAndStatut(enseignantId, mois, StatutPresence.CONGE);

        return ResponseEntity.ok(Map.of(
                "presents", presents, "absents", absents,
                "retards", retards,   "conges", conges,
                "joursOuvres", presents + absents + retards
        ));
    }

    @GetMapping("/enseignants/rapport")
    public ResponseEntity<List<Map<String, Object>>> rapportMensuelEnseignants(
            @RequestParam String mois) {

        List<com.school.entity.User> enseignants = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.ENSEIGNANT && u.isActif())
                .toList();

        List<Map<String, Object>> rapport = new ArrayList<>();
        for (com.school.entity.User u : enseignants) {
            long presents = pointageRepo.countByEnseignantAndMoisAndStatut(u.getId(), mois, StatutPresence.PRESENT);
            long absents  = pointageRepo.countByEnseignantAndMoisAndStatut(u.getId(), mois, StatutPresence.ABSENT);
            long retards  = pointageRepo.countByEnseignantAndMoisAndStatut(u.getId(), mois, StatutPresence.RETARD);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("enseignantId", u.getId());
            row.put("prenom", u.getPrenom());
            row.put("nom", u.getNom());
            row.put("classe", u.getClasse() != null ? u.getClasse().getNom() : "—");
            row.put("presents", presents);
            row.put("absents", absents);
            row.put("retards", retards);
            row.put("joursOuvres", presents + absents + retards);
            rapport.add(row);
        }
        return ResponseEntity.ok(rapport);
    }
}
