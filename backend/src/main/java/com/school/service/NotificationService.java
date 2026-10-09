package com.school.service;

import com.school.entity.*;
import com.school.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final EleveRepository eleveRepo;
    private final BulletinRepository bulletinRepo;
    private final NoteRepository noteRepo;
    private final MatiereRepository matiereRepo;
    private final JavaMailSender mailSender;

    @Value("${school.name:Institut Annour}")
    private String schoolName;

    @Value("${school.email.from:annour.ecole@gmail.com}")
    private String fromEmail;

    // ── Notifier les parents lors de la génération de bulletins ────────────
    public List<Notification> notifierBulletins(Long classeId, String semestre, String anneeScol) {
        List<Eleve> eleves = eleveRepo.findByClasseIdAndActif(classeId, true);
        List<Notification> results = new ArrayList<>();
        for (Eleve eleve : eleves) {
            if (isBlank(eleve.getEmailParent())) continue;
            bulletinRepo.findByEleveIdAndSemestreAndAnneeScol(eleve.getId(), semestre, anneeScol)
                .ifPresent(bulletin -> {
                    List<Note> notes = noteRepo.findByEleveIdAndSemestreAndAnneeScol(eleve.getId(), semestre, anneeScol);
                    List<Matiere> matieres = matiereRepo.findAll();
                    String sujet = String.format("[%s] Bulletin %s — %s %s", schoolName,
                            semestre, eleve.getPrenom(), eleve.getNom());
                    String corps = buildBulletinBody(eleve, bulletin, notes, matieres);
                    results.add(creerEtEnvoyer(TypeNotification.BULLETIN, sujet, corps,
                            eleve, semestre, null, anneeScol));
                });
        }
        return results;
    }

    // ── Rappels fin de mois : élèves ayant des impayés ─────────────────────
    public List<Notification> notifierPaiementsFinMois(List<Eleve> eleves, String mois, String anneeScol) {
        List<Notification> results = new ArrayList<>();
        for (Eleve eleve : eleves) {
            if (isBlank(eleve.getEmailParent())) continue;
            String sujet = String.format("[%s] Rappel paiement — %s %s", schoolName, eleve.getPrenom(), eleve.getNom());
            String corps = buildPaiementBody(eleve, mois);
            results.add(creerEtEnvoyer(TypeNotification.PAIEMENT_FIN_MOIS, sujet, corps, eleve, null, mois, anneeScol));
        }
        return results;
    }

    // ── Message général à tous les parents ─────────────────────────────────
    public List<Notification> notifierGeneral(String sujet, String message, String anneeScol) {
        List<Eleve> eleves = eleveRepo.findAll().stream()
            .filter(e -> e.isActif() && !isBlank(e.getEmailParent()))
            .toList();
        List<Notification> results = new ArrayList<>();
        for (Eleve eleve : eleves) {
            results.add(creerEtEnvoyer(TypeNotification.GENERAL, sujet, message, eleve, null, null, anneeScol));
        }
        return results;
    }

    // ── Absence immédiate ───────────────────────────────────────────────────
    public Notification notifierAbsence(Eleve eleve, String date, boolean justifiee) {
        if (isBlank(eleve.getEmailParent())) return null;
        String sujet = String.format("[%s] Absence signalée — %s %s", schoolName, eleve.getPrenom(), eleve.getNom());
        String corps = buildAbsenceBody(eleve, date, justifiee);
        return creerEtEnvoyer(TypeNotification.ABSENCE, sujet, corps, eleve, null, null, null);
    }

    // ── Méthode commune ────────────────────────────────────────────────────
    private Notification creerEtEnvoyer(TypeNotification type, String sujet, String corps,
                                         Eleve eleve, String semestre, String mois, String anneeScol) {
        Notification n = new Notification();
        n.setType(type);
        n.setSujet(sujet);
        n.setMessage(corps);
        n.setDestinatireEmail(eleve.getEmailParent());
        n.setDestinatireNom(eleve.getPrenom() + " " + eleve.getNom());
        n.setEleve(eleve);
        n.setSemestre(semestre);
        n.setMois(mois);
        n.setAnneeScol(anneeScol);
        try {
            envoyerEmail(eleve.getEmailParent(), sujet, corps);
            n.setEnvoyeEmail(true);
            n.setStatut("ENVOYE");
            n.setDateEnvoi(LocalDateTime.now());
            log.info("✉️  Email envoyé à {} ({})", eleve.getEmailParent(), type);
        } catch (Exception e) {
            n.setStatut("ECHEC");
            log.warn("❌ Échec email {} : {}", eleve.getEmailParent(), e.getMessage());
        }
        return notificationRepo.save(n);
    }

    private void envoyerEmail(String to, String sujet, String corps) throws Exception {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
        h.setFrom(fromEmail, schoolName);
        h.setTo(to);
        h.setSubject(sujet);
        h.setText(corps, false);
        mailSender.send(msg);
    }

    // ── Templates ──────────────────────────────────────────────────────────
    private String buildBulletinBody(Eleve e, Bulletin b, List<Note> notes, List<Matiere> matieres) {
        StringBuilder sb = new StringBuilder();
        sb.append("Cher(e) parent/tuteur de ").append(e.getPrenom()).append(" ").append(e.getNom()).append(",\n\n");
        sb.append(schoolName).append(" vous informe que le bulletin du ").append(b.getSemestre())
          .append(" (").append(b.getAnneeScol()).append(") est disponible.\n\n");
        sb.append("══════════════════════════════════════════\n");
        sb.append("  BULLETIN DE ").append(e.getPrenom().toUpperCase()).append(" ").append(e.getNom().toUpperCase()).append("\n");
        sb.append("  Classe : ").append(e.getClasse() != null ? e.getClasse().getNom() : "N/A").append("\n");
        sb.append("══════════════════════════════════════════\n\n");
        sb.append("  NOTES PAR MATIÈRE\n");
        sb.append("  ──────────────────────────────────────\n");
        for (Note note : notes) {
            String mat = note.getMatiere() != null ? note.getMatiere().getNom() : "Matière";
            int max = note.getMatiere() != null ? note.getMatiere().getNoteMax() : 20;
            double total = note.getTotal() != null ? note.getTotal() : 0;
            String appre = note.getAppreciation() != null ? note.getAppreciation() : "";
            sb.append(String.format("  %-28s %5.1f / %-3d  %s%n", mat, total, max, appre));
        }
        sb.append("  ──────────────────────────────────────\n\n");
        double moy = b.getMoyenne() != null ? b.getMoyenne() : 0;
        double moyC = b.getMoyenneClasse() != null ? b.getMoyenneClasse() : 0;
        sb.append(String.format("  Moyenne générale   : %.2f / 20%n", moy));
        sb.append(String.format("  Moyenne de classe  : %.2f / 20%n", moyC));
        sb.append(String.format("  Rang               : %d%n", b.getRang() != null ? b.getRang() : 0));
        sb.append(String.format("  Appréciation       : %s%n%n", b.getAppreciation() != null ? b.getAppreciation() : ""));
        sb.append("Pour consulter le bulletin complet, rapprochez-vous de l'établissement.\n\n");
        sb.append("Cordialement,\nLa Direction de ").append(schoolName).append("\nDiourbel, Sénégal");
        return sb.toString();
    }

    private String buildPaiementBody(Eleve e, String mois) {
        return "Cher(e) parent/tuteur de " + e.getPrenom() + " " + e.getNom() + ",\n\n"
            + "Nous vous rappelons que des frais scolaires sont en attente de règlement "
            + "pour votre enfant inscrit à " + schoolName + ".\n\n"
            + "  Élève    : " + e.getPrenom() + " " + e.getNom() + "\n"
            + "  Classe   : " + (e.getClasse() != null ? e.getClasse().getNom() : "N/A") + "\n"
            + "  Période  : " + mois + "\n\n"
            + "Nous vous invitons à régulariser votre situation auprès du secrétariat de l'école.\n\n"
            + "Cordialement,\nLa Direction de " + schoolName + "\nDiourbel, Sénégal";
    }

    private String buildAbsenceBody(Eleve e, String date, boolean justifiee) {
        return "Cher(e) parent/tuteur de " + e.getPrenom() + " " + e.getNom() + ",\n\n"
            + "Une absence a été enregistrée pour votre enfant.\n\n"
            + "  Élève    : " + e.getPrenom() + " " + e.getNom() + "\n"
            + "  Classe   : " + (e.getClasse() != null ? e.getClasse().getNom() : "N/A") + "\n"
            + "  Date     : " + date + "\n"
            + "  Statut   : " + (justifiee ? "Justifiée ✓" : "⚠️ Non justifiée — merci de fournir un justificatif") + "\n\n"
            + "Cordialement,\nLa Direction de " + schoolName + "\nDiourbel, Sénégal";
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
