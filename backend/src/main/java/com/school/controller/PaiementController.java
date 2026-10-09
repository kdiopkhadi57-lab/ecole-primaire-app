package com.school.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.school.entity.Eleve;
import com.school.entity.PaiementEleve;
import com.school.entity.StatutPaiement;
import com.school.repository.EleveRepository;
import com.school.repository.PaiementEleveRepository;
import com.school.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementEleveRepository paiementRepo;
    private final EleveRepository eleveRepo;
    private final UserRepository userRepo;

    @GetMapping
    public List<PaiementEleve> getAll(
            @RequestParam(required = false) Long eleveId,
            @RequestParam(required = false) Long classeId,
            @RequestParam(required = false) String anneeScol,
            @RequestParam(required = false) String statut) {

        if (eleveId != null && anneeScol != null)
            return paiementRepo.findByEleveIdAndAnneeScol(eleveId, anneeScol);
        if (eleveId != null)
            return paiementRepo.findByEleveId(eleveId);
        if (classeId != null && anneeScol != null)
            return paiementRepo.findByEleveClasseIdAndAnneeScol(classeId, anneeScol);
        if (anneeScol != null)
            return paiementRepo.findByAnneeScol(anneeScol);
        if (statut != null)
            return paiementRepo.findByStatut(StatutPaiement.valueOf(statut));
        return paiementRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaiementEleve> getById(@PathVariable Long id) {
        return paiementRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PaiementEleve> create(@RequestBody Map<String, Object> body) {
        PaiementEleve p = buildPaiement(body, null);
        return ResponseEntity.ok(paiementRepo.save(p));
    }

        @GetMapping("/rapport-journalier")
        public ResponseEntity<Map<String, Object>> rapportJournalier(
            @RequestParam LocalDate date,
            @RequestParam(required = false) String anneeScol) {
        List<PaiementEleve> duJour = paiementRepo.findAll().stream()
            .filter(p -> date.equals(p.getDatePaiement()))
            .filter(p -> anneeScol == null || anneeScol.equals(p.getAnneeScol()))
            .filter(p -> p.getMontantPaye() != null && p.getMontantPaye() > 0)
            .toList();

        Map<Long, List<PaiementEleve>> parEleve = new LinkedHashMap<>();
        for (PaiementEleve paiement : duJour) {
            parEleve.computeIfAbsent(paiement.getEleve().getId(), ignored -> new ArrayList<>()).add(paiement);
        }

        List<Map<String, Object>> lignes = new ArrayList<>();
        double total = 0;
        double totalInscriptions = 0;
        double totalScolarite = 0;
        for (List<PaiementEleve> paiements : parEleve.values()) {
            Eleve eleve = paiements.get(0).getEleve();
            double inscription = paiements.stream()
                .filter(p -> "INSCRIPTION".equals(p.getTypePaiement()))
                .mapToDouble(p -> p.getMontantPaye() == null ? 0 : p.getMontantPaye()).sum();
            double scolarite = paiements.stream()
                .filter(p -> p.getTypePaiement() != null && p.getTypePaiement().startsWith("SCOLARITE_"))
                .mapToDouble(p -> p.getMontantPaye() == null ? 0 : p.getMontantPaye()).sum();
            List<String> mois = paiements.stream()
                .filter(p -> p.getTypePaiement() != null && p.getTypePaiement().startsWith("SCOLARITE_"))
                .map(p -> p.getTypePaiement().substring("SCOLARITE_".length()))
                .toList();
            long moisPayesAnnee = paiementRepo.findByEleveIdAndAnneeScol(eleve.getId(), paiements.get(0).getAnneeScol()).stream()
                .filter(p -> p.getTypePaiement() != null && p.getTypePaiement().startsWith("SCOLARITE_"))
                .filter(p -> p.getMontantRestant() != null && p.getMontantRestant() == 0)
                .count();
            double totalEleve = inscription + scolarite;
            Map<String, Object> ligne = new LinkedHashMap<>();
            ligne.put("eleveId", eleve.getId());
            ligne.put("eleve", eleve.getPrenom() + " " + eleve.getNom());
            ligne.put("matricule", eleve.getMatricule());
            ligne.put("classe", eleve.getClasse().getNom());
            ligne.put("inscriptionVersee", inscription);
            ligne.put("moisAvance", mois);
            ligne.put("anneeCompletePayee", moisPayesAnnee >= 10);
            ligne.put("totalPaye", totalEleve);
            lignes.add(ligne);
            total += totalEleve;
            totalInscriptions += inscription;
            totalScolarite += scolarite;
        }

        Map<String, Object> rapport = new LinkedHashMap<>();
        rapport.put("date", date);
        rapport.put("total", total);
        rapport.put("totalInscriptions", totalInscriptions);
        rapport.put("totalScolarite", totalScolarite);
        rapport.put("nombreEleves", lignes.size());
        rapport.put("lignes", lignes);
        return ResponseEntity.ok(rapport);
        }

    @PutMapping("/{id}")
    public ResponseEntity<PaiementEleve> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return paiementRepo.findById(id).map(existing -> {
            PaiementEleve updated = buildPaiement(body, existing);
            return ResponseEntity.ok(paiementRepo.save(updated));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        paiementRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam String anneeScol) {
        Double totalEncaisse = paiementRepo.totalEncaisseAnnee(anneeScol);
        Double totalRestant  = paiementRepo.totalRestantAnnee(anneeScol);
        long nbImpayes       = paiementRepo.countElevesImpayes(anneeScol);
        long nbTotal         = paiementRepo.findByAnneeScol(anneeScol).stream()
                .map(p -> p.getEleve().getId()).distinct().count();

        return ResponseEntity.ok(Map.of(
                "totalEncaisse", totalEncaisse != null ? totalEncaisse : 0,
                "totalRestant",  totalRestant  != null ? totalRestant  : 0,
                "nbImpayes", nbImpayes,
                "nbTotal", nbTotal
        ));
    }

    @PostMapping("/inscrire-classe")
    public ResponseEntity<Map<String, Object>> inscrireClasse(@RequestBody Map<String, Object> body) {
        Long classeId = Long.valueOf(body.get("classeId").toString());
        String anneeScol = (String) body.get("anneeScol");
        double montantInscription = Double.parseDouble(body.get("montantInscription").toString());
        double montantScolarite = Double.parseDouble(body.get("montantScolarite").toString());

        List<Eleve> eleves = eleveRepo.findByClasseIdAndActif(classeId, true);
        int created = 0;

        for (Eleve e : eleves) {
            // Frais d'inscription
            boolean hasInscription = paiementRepo.findByEleveIdAndAnneeScol(e.getId(), anneeScol)
                    .stream().anyMatch(p -> "INSCRIPTION".equals(p.getTypePaiement()));
            if (!hasInscription && montantInscription > 0) {
                PaiementEleve p = new PaiementEleve();
                p.setEleve(e);
                p.setTypePaiement("INSCRIPTION");
                p.setMontantDu(montantInscription);
                p.setMontantPaye(0.0);
                p.setMontantRestant(montantInscription);
                p.setStatut(StatutPaiement.IMPAYE);
                p.setAnneeScol(anneeScol);
                p.setDateEcheance(LocalDate.now().plusMonths(1));
                paiementRepo.save(p);
                created++;
            }

            // Frais de scolarité par trimestre
            for (int t = 1; t <= 3; t++) {
                String type = "SCOLARITE_T" + t;
                boolean hasScol = paiementRepo.findByEleveIdAndAnneeScol(e.getId(), anneeScol)
                        .stream().anyMatch(p -> type.equals(p.getTypePaiement()));
                if (!hasScol && montantScolarite > 0) {
                    PaiementEleve p = new PaiementEleve();
                    p.setEleve(e);
                    p.setTypePaiement(type);
                    p.setTrimestre("T" + t);
                    p.setMontantDu(montantScolarite);
                    p.setMontantPaye(0.0);
                    p.setMontantRestant(montantScolarite);
                    p.setStatut(StatutPaiement.IMPAYE);
                    p.setAnneeScol(anneeScol);
                    p.setDateEcheance(LocalDate.of(2024, t * 3, 30));
                    paiementRepo.save(p);
                    created++;
                }
            }
        }
        return ResponseEntity.ok(Map.of("created", created, "eleves", eleves.size()));
    }

    private PaiementEleve buildPaiement(Map<String, Object> body, PaiementEleve existing) {
        PaiementEleve p = existing != null ? existing : new PaiementEleve();

        if (body.get("eleveId") != null)
            p.setEleve(eleveRepo.findById(Long.valueOf(body.get("eleveId").toString())).orElseThrow());
        if (body.get("typePaiement") != null) p.setTypePaiement((String) body.get("typePaiement"));
        if (body.get("trimestre") != null) p.setTrimestre((String) body.get("trimestre"));
        if (body.get("anneeScol") != null) p.setAnneeScol((String) body.get("anneeScol"));
        if (body.get("modePaiement") != null) p.setModePaiement((String) body.get("modePaiement"));
        if (body.get("notes") != null) p.setNotes((String) body.get("notes"));

        double montantDu = body.get("montantDu") != null ? Double.parseDouble(body.get("montantDu").toString())
                : (p.getMontantDu() != null ? p.getMontantDu() : 0);
        double montantPaye = body.get("montantPaye") != null ? Double.parseDouble(body.get("montantPaye").toString())
                : (p.getMontantPaye() != null ? p.getMontantPaye() : 0);
        double montantRestant = montantDu - montantPaye;

        p.setMontantDu(montantDu);
        p.setMontantPaye(montantPaye);
        p.setMontantRestant(Math.max(montantRestant, 0));

        if (montantRestant <= 0) p.setStatut(StatutPaiement.PAYE);
        else if (montantPaye > 0) p.setStatut(StatutPaiement.PARTIEL);
        else p.setStatut(StatutPaiement.IMPAYE);

        if (montantPaye > 0 && body.get("datePaiement") == null)
            p.setDatePaiement(LocalDate.now());
        else if (body.get("datePaiement") != null)
            p.setDatePaiement(LocalDate.parse((String) body.get("datePaiement")));

        if (body.get("dateEcheance") != null)
            p.setDateEcheance(LocalDate.parse((String) body.get("dateEcheance")));

        if (body.get("encaisseurId") != null)
            p.setEncaisseur(userRepo.findById(Long.valueOf(body.get("encaisseurId").toString())).orElse(null));

        if (montantPaye > 0)
            p.setReferenceRecu("RECU-" + System.currentTimeMillis() % 100000);

        return p;
    }
}
