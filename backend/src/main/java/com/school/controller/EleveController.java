package com.school.controller;

import com.school.entity.Classe;
import com.school.entity.Eleve;
import com.school.entity.PaiementEleve;
import com.school.entity.StatutPaiement;
import com.school.dto.EleveCreationRequest;
import com.school.repository.ClasseRepository;
import com.school.repository.EleveRepository;
import com.school.repository.PaiementEleveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/api/eleves")
@RequiredArgsConstructor
public class EleveController {

    private final EleveRepository eleveRepo;
    private final ClasseRepository classeRepo;
    private final PaiementEleveRepository paiementRepo;

    @GetMapping
    public List<Eleve> getAll(@RequestParam(required = false) Long classeId,
                               @RequestParam(required = false) String anneeScol) {
        if (classeId != null) return eleveRepo.findByClasseIdAndActif(classeId, true);
        if (anneeScol != null) return eleveRepo.findByAnneeScol(anneeScol);
        return eleveRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Eleve> getById(@PathVariable Long id) {
        return eleveRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> create(@RequestBody EleveCreationRequest request) {
        Eleve eleve = request.getEleve();
        if (eleve == null || eleve.getClasse() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Les informations de l'élève et la classe sont obligatoires"));
        }
        eleve.setMatricule(generateMatricule());
        Eleve saved = eleveRepo.save(eleve);
        updateEffectifs(saved.getClasse().getId());

        double inscription = amount(saved.getMontantInscription());
        double mensuel = amount(saved.getMontantMensuel());
        double payeInscription = Math.min(amount(request.getMontantPayeInscription()), inscription);
        double payeOctobre = Math.min(amount(request.getMontantPayeOctobre()), mensuel);
        String anneeScol = saved.getAnneeScol();
        List<PaiementEleve> paiements = new ArrayList<>();

        if (inscription > 0) {
            paiements.add(createPayment(saved, "INSCRIPTION", inscription, payeInscription,
                    anneeScol, null, LocalDate.now()));
        }
        if (mensuel > 0) {
            int startYear = Integer.parseInt(anneeScol.substring(0, 4));
            String[] mois = {"OCTOBRE", "NOVEMBRE", "DECEMBRE", "JANVIER", "FEVRIER",
                    "MARS", "AVRIL", "MAI", "JUIN", "JUILLET"};
            for (int i = 0; i < mois.length; i++) {
                boolean annual = request.isAnneeCompletePayee();
                double paye = annual ? mensuel : (i == 0 ? payeOctobre : 0);
                int monthNumber = i + 10;
                YearMonth month = YearMonth.of(startYear + (monthNumber > 12 ? 1 : 0),
                    monthNumber > 12 ? monthNumber - 12 : monthNumber);
                paiements.add(createPayment(saved, "SCOLARITE_" + mois[i], mensuel, paye,
                        anneeScol, null, month.atEndOfMonth()));
            }
        }
        paiementRepo.saveAll(paiements);
        double total = paiements.stream().mapToDouble(PaiementEleve::getMontantDu).sum();
        return ResponseEntity.ok(Map.of("eleve", saved, "paiements", paiements, "totalFacture", total));
    }

    private double amount(Double value) {
        return value == null ? 0 : Math.max(value, 0);
    }

    private PaiementEleve createPayment(Eleve eleve, String type, double due, double paid,
                                        String anneeScol, String trimestre, LocalDate echeance) {
        PaiementEleve payment = new PaiementEleve();
        payment.setEleve(eleve);
        payment.setTypePaiement(type);
        payment.setMontantDu(due);
        payment.setMontantPaye(paid);
        payment.setMontantRestant(Math.max(due - paid, 0));
        payment.setStatut(paid >= due ? StatutPaiement.PAYE : paid > 0 ? StatutPaiement.PARTIEL : StatutPaiement.IMPAYE);
        payment.setDatePaiement(paid > 0 ? LocalDate.now() : null);
        payment.setDateEcheance(echeance);
        payment.setAnneeScol(anneeScol);
        payment.setTrimestre(trimestre);
        if (paid > 0) payment.setReferenceRecu("RECU-" + System.currentTimeMillis() % 100000);
        return payment;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Eleve> update(@PathVariable Long id, @RequestBody Eleve eleve) {
        return eleveRepo.findById(id).map(existing -> {
            eleve.setId(id);
            if (eleve.getMatricule() == null) eleve.setMatricule(existing.getMatricule());
            return ResponseEntity.ok(eleveRepo.save(eleve));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return eleveRepo.findById(id).map(e -> {
            e.setActif(false);
            eleveRepo.save(e);
            updateEffectifs(e.getClasse().getId());
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("classeId") Long classeId,
            @RequestParam("anneeScol") String anneeScol) {
        List<String> errors = new ArrayList<>();
        List<Eleve> created = new ArrayList<>();
        Classe classe = classeRepo.findById(classeId)
                .orElseThrow(() -> new RuntimeException("Classe non trouvée"));
        try (InputStream is = file.getInputStream(); Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    Eleve e = new Eleve();
                    e.setPrenom(getCellValue(row, 0));
                    e.setNom(getCellValue(row, 1));
                    String dateStr = getCellValue(row, 2);
                    if (dateStr != null && !dateStr.isBlank()) e.setDateNaissance(LocalDate.parse(dateStr));
                    e.setLieuNaissance(getCellValue(row, 3));
                    e.setSexe(getCellValue(row, 4));
                    e.setNomPere(getCellValue(row, 5));
                    e.setNomMere(getCellValue(row, 6));
                    e.setTelephoneParent(getCellValue(row, 7));
                    e.setAdresse(getCellValue(row, 8));
                    e.setEmailParent(getCellValue(row, 9)); // ← colonne J : email parent
                    e.setClasse(classe);
                    e.setAnneeScol(anneeScol);
                    e.setMatricule(generateMatricule());
                    created.add(eleveRepo.save(e));
                } catch (Exception ex) {
                    errors.add("Ligne " + (i + 1) + ": " + ex.getMessage());
                }
            }
            updateEffectifs(classeId);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
        return ResponseEntity.ok(Map.of("created", created.size(), "errors", errors));
    }

    private String getCellValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private void updateEffectifs(Long classeId) {
        classeRepo.findById(classeId).ifPresent(c -> {
            c.setEffectifs((int) eleveRepo.countActiveByClasse(classeId));
            classeRepo.save(c);
        });
    }

    private String generateMatricule() {
        return "SN" + System.currentTimeMillis() % 100000;
    }
}
