package com.school.controller;

import com.school.entity.*;
import com.school.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/salaires")
@RequiredArgsConstructor
public class SalaireController {

    private final SalaireProfesseurRepository salaireRepo;
    private final ConfigurationSalaireRepository configRepo;
    private final UserRepository userRepo;
    private final PointageRepository pointageRepo;

    // ── Configurations salaires ───────────────────────────────────────────
    @GetMapping("/configs")
    public List<ConfigurationSalaire> getAllConfigs() {
        return configRepo.findAll();
    }

    @PostMapping("/configs")
    public ResponseEntity<ConfigurationSalaire> saveConfig(@RequestBody Map<String, Object> body) {
        Long enseignantId = Long.valueOf(body.get("enseignantId").toString());

        ConfigurationSalaire config = configRepo.findByEnseignantId(enseignantId)
                .orElse(new ConfigurationSalaire());
        config.setEnseignant(userRepo.findById(enseignantId).orElseThrow());
        config.setSalaireBase(parseDouble(body.get("salaireBase")));
        config.setPrimeAnciennete(parseDouble(body.get("primeAnciennete")));
        config.setIndemnitesTransport(parseDouble(body.get("indemnitesTransport")));
        config.setIndemnitesLogement(parseDouble(body.get("indemnitesLogement")));
        config.setAutresIndemnites(parseDouble(body.get("autresIndemnites")));
        config.setAnneesAnciennete(body.get("anneesAnciennete") != null
                ? Integer.parseInt(body.get("anneesAnciennete").toString()) : 0);
        config.setNiveauQualification((String) body.get("niveauQualification"));
        config.setAnneeScol((String) body.get("anneeScol"));
        config.setActif(true);
        return ResponseEntity.ok(configRepo.save(config));
    }

    // ── Salaires ──────────────────────────────────────────────────────────
    @GetMapping
    public List<SalaireProfesseur> getAll(
            @RequestParam(required = false) String mois,
            @RequestParam(required = false) Long enseignantId,
            @RequestParam(required = false) String anneeScol) {

        if (mois != null) return salaireRepo.findByMois(mois);
        if (enseignantId != null) return salaireRepo.findByEnseignantId(enseignantId);
        if (anneeScol != null) return salaireRepo.findByAnneeScol(anneeScol);
        return salaireRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaireProfesseur> getById(@PathVariable Long id) {
        return salaireRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // ── Génération des fiches de paie ─────────────────────────────────────
    @PostMapping("/generer")
    public ResponseEntity<Map<String, Object>> genererFichesPaie(@RequestBody Map<String, Object> body) {
        String mois = (String) body.get("mois");
        String anneeScol = (String) body.get("anneeScol");
        int joursOuvres = body.get("joursOuvres") != null
                ? Integer.parseInt(body.get("joursOuvres").toString()) : 26;

        List<User> enseignants = userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.ENSEIGNANT && u.isActif())
                .toList();

        int generated = 0;
        List<Map<String, Object>> fiches = new ArrayList<>();

        for (User enseignant : enseignants) {
            if (salaireRepo.findByEnseignantIdAndMois(enseignant.getId(), mois).isPresent()) {
                continue; // déjà générée
            }

            ConfigurationSalaire config = configRepo.findByEnseignantIdAndActif(enseignant.getId(), true)
                    .orElse(null);

            double salaireBase = config != null && config.getSalaireBase() != null
                    ? config.getSalaireBase() : 150000.0;
            double primeAnc = config != null && config.getPrimeAnciennete() != null
                    ? config.getPrimeAnciennete() : 0.0;
            double transport = config != null && config.getIndemnitesTransport() != null
                    ? config.getIndemnitesTransport() : 15000.0;
            double logement = config != null && config.getIndemnitesLogement() != null
                    ? config.getIndemnitesLogement() : 0.0;
            double autres = config != null && config.getAutresIndemnites() != null
                    ? config.getAutresIndemnites() : 0.0;

            // Absences non justifiées
            long absNonJustif = pointageRepo.findByTypePointageAndMois("ENSEIGNANT", mois).stream()
                    .filter(p -> p.getEnseignant() != null
                            && p.getEnseignant().getId().equals(enseignant.getId())
                            && p.getStatut() == StatutPresence.ABSENT
                            && !p.isJustifie())
                    .count();

            double salaireBrut = salaireBase + primeAnc + transport + logement + autres;
            double deductionAbsences = joursOuvres > 0
                    ? (salaireBase / joursOuvres) * absNonJustif : 0;

            // Cotisations Sénégal approximatives
            double cotIPRES = (salaireBase + primeAnc) * 0.084; // 8.4% part salarié IPRES
            double cotCSS   = (salaireBase + primeAnc) * 0.07;  // 7% CSS
            double baseImposable = salaireBrut - cotIPRES - cotCSS - deductionAbsences;
            double irpp = calculIRPP(baseImposable);

            double salaireNet = salaireBrut - cotIPRES - cotCSS - irpp - deductionAbsences;

            SalaireProfesseur s = new SalaireProfesseur();
            s.setEnseignant(enseignant);
            s.setMois(mois);
            s.setAnneeScol(anneeScol);
            s.setSalaireBase(salaireBase);
            s.setPrimeAnciennete(primeAnc);
            s.setIndemnitesTransport(transport);
            s.setIndemnitesLogement(logement);
            s.setAutresIndemnites(autres);
            s.setSalaireBrut(round2(salaireBrut));
            s.setCotisationIPRES(round2(cotIPRES));
            s.setCotisationCSS(round2(cotCSS));
            s.setImpotSurRevenu(round2(irpp));
            s.setJoursAbsenceNonJustifie((int) absNonJustif);
            s.setDeductionAbsences(round2(deductionAbsences));
            s.setSalaireNet(round2(salaireNet));
            s.setStatut(StatutPaiement.IMPAYE);
            s.setValide(false);
            SalaireProfesseur saved = salaireRepo.save(s);
            generated++;

            Map<String, Object> fiche = new LinkedHashMap<>();
            fiche.put("id", saved.getId());
            fiche.put("enseignant", enseignant.getPrenom() + " " + enseignant.getNom());
            fiche.put("salaireNet", saved.getSalaireNet());
            fiches.add(fiche);
        }

        Double totalMasse = salaireRepo.totalMasseSalarialeParMois(mois);
        return ResponseEntity.ok(Map.of(
                "generated", generated,
                "mois", mois,
                "totalMasseSalariale", totalMasse != null ? totalMasse : 0,
                "fiches", fiches
        ));
    }

    @PutMapping("/{id}/payer")
    public ResponseEntity<SalaireProfesseur> marquerPaye(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return salaireRepo.findById(id).map(s -> {
            s.setStatut(StatutPaiement.PAYE);
            s.setDatePaiement(LocalDate.now());
            if (body.get("modePaiement") != null) s.setModePaiement((String) body.get("modePaiement"));
            if (body.get("referenceVirement") != null) s.setReferenceVirement((String) body.get("referenceVirement"));
            return ResponseEntity.ok(salaireRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/valider")
    public ResponseEntity<SalaireProfesseur> valider(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return salaireRepo.findById(id).map(s -> {
            s.setValide(true);
            s.setDateValidation(LocalDate.now());
            if (body.get("validateurId") != null) {
                userRepo.findById(Long.valueOf(body.get("validateurId").toString()))
                        .ifPresent(s::setValidateur);
            }
            return ResponseEntity.ok(salaireRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(
            @RequestParam(required = false) String mois,
            @RequestParam String anneeScol) {

        Double totalAnnee = salaireRepo.totalMasseSalarialeAnnee(anneeScol);
        Double totalMois = mois != null ? salaireRepo.totalMasseSalarialeParMois(mois) : null;
        long nbImpayes = mois != null
                ? salaireRepo.findByMoisAndStatut(mois, StatutPaiement.IMPAYE).size() : 0;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalMasseSalarialeAnnee", totalAnnee != null ? totalAnnee : 0);
        if (totalMois != null) stats.put("totalMasseSalarialeMois", totalMois);
        stats.put("nbImpayes", nbImpayes);
        return ResponseEntity.ok(stats);
    }

    private double calculIRPP(double baseImposable) {
        // Barème IRPP Sénégal simplifié (mensuel)
        if (baseImposable <= 41667) return 0;
        if (baseImposable <= 100000) return (baseImposable - 41667) * 0.20;
        if (baseImposable <= 166667) return 11667 + (baseImposable - 100000) * 0.30;
        return 31667 + (baseImposable - 166667) * 0.35;
    }

    private double parseDouble(Object val) {
        if (val == null) return 0.0;
        return Double.parseDouble(val.toString());
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
