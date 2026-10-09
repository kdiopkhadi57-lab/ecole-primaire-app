package com.school;

import com.school.entity.*;
import com.school.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.*;

@SpringBootApplication
public class EcolePrimaireApplication {

    public static void main(String[] args) {
        SpringApplication.run(EcolePrimaireApplication.class, args);
    }

    @Bean
    CommandLineRunner initData(
            UserRepository userRepo,
            ClasseRepository classeRepo,
            MatiereRepository matiereRepo,
            EleveRepository eleveRepo,
            NoteRepository noteRepo,
            BulletinRepository bulletinRepo,
            PointageRepository pointageRepo,
            PaiementEleveRepository paiementRepo,
            SalaireProfesseurRepository salaireRepo,
            ConfigurationSalaireRepository configSalaireRepo,
            DevoirRepository devoirRepo,
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            // ═══ GUARD GLOBAL : ne rien faire si données déjà présentes ═══
            if (matiereRepo.count() > 0) {
                removeLegacyRoleConstraints(jdbcTemplate);
                seedParentPortalData(userRepo, eleveRepo, matiereRepo, noteRepo, devoirRepo, passwordEncoder);
                System.out.println("ℹ️  Données déjà présentes — démarrage normal.");
                return;
            }

            Random rnd = new Random(42);
            System.out.println("⏳ Chargement des données de démonstration...");

            // ─── 1. MATIERES ────────────────────────────────────────────────
            List<Matiere> matieres = new ArrayList<>();
            String[][] matiereData = {
                {"Langue et Communication", "20"},
                {"Découverte du Monde",     "30"},
                {"Développement Durable",   "20"},
                {"Mathématique",            "40"},
                {"Education Artistique",    "5"},
                {"Chant / Récitation",      "5"}
            };
            int ordre = 1;
            for (String[] m : matiereData) {
                Matiere mat = new Matiere();
                mat.setNom(m[0]);
                mat.setNoteMax(Integer.parseInt(m[1]));
                mat.setOrdre(ordre++);
                matieres.add(matiereRepo.save(mat));
            }
            int totalMax = matieres.stream().mapToInt(Matiere::getNoteMax).sum();

            // ─── 2. CLASSES ─────────────────────────────────────────────────
            String[] nomClasses = {"CI", "CP", "CE1", "CE2", "CM1", "CM2"};
            Map<String, Classe> classesMap = new LinkedHashMap<>();
            for (String nom : nomClasses) {
                Classe c = new Classe();
                c.setNom(nom);
                c.setEffectifs(0);
                classesMap.put(nom, classeRepo.save(c));
            }

            // ─── 3. UTILISATEURS ────────────────────────────────────────────
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setPrenom("Ibrahima"); admin.setNom("DIALLO");
            admin.setEmail("admin@annour.sn"); admin.setTelephone("77 100 00 00");
            admin.setRole(Role.ADMIN); admin.setActif(true);
            userRepo.save(admin);

            User dir = new User();
            dir.setUsername("directeur");
            dir.setPassword(passwordEncoder.encode("directeur123"));
            dir.setPrenom("Mamadou"); dir.setNom("NDIAYE");
            dir.setEmail("directeur@annour.sn"); dir.setTelephone("77 200 00 00");
            dir.setRole(Role.DIRECTEUR); dir.setActif(true);
            userRepo.save(dir);

            String[][] ensData = {
                {"maitre.ci",  "Fatou",     "SENE",  "77 301 00 00", "CI"},
                {"maitre.cp",  "Ousmane",   "FALL",  "77 302 00 00", "CP"},
                {"maitre.ce1", "Aissatou",  "DIOP",  "77 303 00 00", "CE1"},
                {"maitre.ce2", "Moussa",    "WADE",  "77 304 00 00", "CE2"},
                {"maitre.cm1", "Mariama",   "CISSE", "77 305 00 00", "CM1"},
                {"maitre.cm2", "Abdoulaye", "SARR",  "77 306 00 00", "CM2"}
            };
            List<User> enseignantsList = new ArrayList<>();
            for (String[] e : ensData) {
                User u = new User();
                u.setUsername(e[0]);
                u.setPassword(passwordEncoder.encode("ecole123"));
                u.setPrenom(e[1]); u.setNom(e[2]); u.setTelephone(e[3]);
                u.setEmail(e[0] + "@annour.sn");
                u.setRole(Role.ENSEIGNANT); u.setActif(true);
                u.setClasse(classesMap.get(e[4]));
                enseignantsList.add(userRepo.save(u));
            }

            // ─── 4. ELEVES ──────────────────────────────────────────────────
            String[][][] elevesData = {
                { // CI
                    {"Aminata","DIALLO","F","2018","Diourbel"},{"Pape","NDIAYE","M","2018","Bambey"},
                    {"Mariama","FALL","F","2018","Diourbel"},{"Ibou","SENE","M","2018","Thiès"},
                    {"Fatou","DIOP","F","2018","Diourbel"},{"Moussa","WADE","M","2018","Bambey"},
                    {"Aissatou","CISSE","F","2018","Diourbel"},{"Omar","SARR","M","2018","Diourbel"}
                },
                { // CP
                    {"Sokhna","TOURE","F","2017","Diourbel"},{"Cheikh","LO","M","2017","Bambey"},
                    {"Ndèye","DIALLO","F","2017","Diourbel"},{"Abdou","FAYE","M","2017","Thiès"},
                    {"Khady","NDAO","F","2017","Diourbel"},{"Babacar","DIENG","M","2017","Bambey"},
                    {"Astou","MBAYE","F","2017","Diourbel"},{"Modou","GAYE","M","2017","Diourbel"}
                },
                { // CE1
                    {"Coumba","SECK","F","2016","Diourbel"},{"Lamine","DIOUF","M","2016","Bambey"},
                    {"Adja","NIANG","F","2016","Diourbel"},{"Birame","DIAGNE","M","2016","Thiès"},
                    {"Yacine","NDIAYE","F","2016","Diourbel"},{"Mamadou","DIALLO","M","2016","Bambey"},
                    {"Oumou","FALL","F","2016","Diourbel"},{"Serigne","TOURE","M","2016","Diourbel"}
                },
                { // CE2
                    {"Fatoumata","DIOP","F","2015","Diourbel"},{"Ibrahima","WADE","M","2015","Bambey"},
                    {"Maimouna","SENE","F","2015","Diourbel"},{"Abdoulaye","FAYE","M","2015","Thiès"},
                    {"Aida","SARR","F","2015","Bambey"},{"Marème","BA","F","2015","Diourbel"},
                    {"Oumar","NDOYE","M","2015","Diourbel"}
                },
                { // CM1
                    {"Binta","DIALLO","F","2014","Diourbel"},{"Cheikhou","NDIAYE","M","2014","Bambey"},
                    {"Salimata","FALL","F","2014","Diourbel"},{"Mamour","SENE","M","2014","Thiès"},
                    {"Daouda","WADE","M","2014","Bambey"},{"Aminata","CISSE","F","2014","Diourbel"},
                    {"Ndeye Fatou","DIOP","F","2014","Diourbel"}
                },
                { // CM2
                    {"Rama","MBAYE","F","2013","Diourbel"},{"Malick","BA","M","2013","Bambey"},
                    {"Awa","DIAGNE","F","2013","Diourbel"},{"Pape Samba","NDIAYE","M","2013","Thiès"},
                    {"Fama","DIALLO","F","2013","Diourbel"},{"Alioune","FALL","M","2013","Bambey"},
                    {"Ndèye Coumba","SECK","F","2013","Diourbel"},{"Idrissa","GAYE","M","2013","Diourbel"}
                }
            };

            Map<String, List<Eleve>> elevesParClasse = new LinkedHashMap<>();
            for (int ci = 0; ci < nomClasses.length; ci++) {
                String className = nomClasses[ci];
                String[][] data = elevesData[ci];
                int anneeNaiss = Integer.parseInt(data[0][3]);
                List<Eleve> liste = new ArrayList<>();
                for (String[] ed : data) {
                    Eleve eleve = new Eleve();
                    eleve.setPrenom(ed[0]); eleve.setNom(ed[1]); eleve.setSexe(ed[2]);
                    eleve.setDateNaissance(LocalDate.of(anneeNaiss, 1 + rnd.nextInt(12), 1 + rnd.nextInt(28)));
                    eleve.setLieuNaissance(ed[4]);
                    eleve.setClasse(classesMap.get(className));
                    eleve.setAnneeScol("2023-2024");
                    eleve.setActif(true);
                    eleve.setNomPere("Ibrahima " + ed[1]);
                    eleve.setNomMere("Fatou " + ed[1]);
                    eleve.setTelephoneParent("77 4" + String.format("%02d", rnd.nextInt(100)) + " " + String.format("%02d", rnd.nextInt(100)) + " " + String.format("%02d", rnd.nextInt(100)));
                    eleve.setAdresse("Quartier " + ed[4]);
                    eleve.setMatricule("SN" + String.format("%05d", 10000 + (ci * 100) + liste.size()));
                    liste.add(eleveRepo.save(eleve));
                }
                Classe cls = classesMap.get(className);
                cls.setEffectifs(liste.size());
                classeRepo.save(cls);
                elevesParClasse.put(className, liste);
            }

            // ─── 5. NOTES S1 ────────────────────────────────────────────────
            for (Map.Entry<String, List<Eleve>> entry : elevesParClasse.entrySet()) {
                for (Eleve eleve : entry.getValue()) {
                    for (Matiere mat : matieres) {
                        double maxRes = mat.getNoteMax() / 2.0;
                        double noteRes = Math.round((maxRes * (0.4 + rnd.nextDouble() * 0.6)) * 2) / 2.0;
                        double noteComp = Math.round((maxRes * (0.4 + rnd.nextDouble() * 0.6)) * 2) / 2.0;
                        double total = noteRes + noteComp;
                        Note note = new Note();
                        note.setEleve(eleve); note.setMatiere(mat);
                        note.setNoteRessources(noteRes); note.setNoteCompetences(noteComp);
                        note.setTotal(total);
                        double pct = total / mat.getNoteMax();
                        note.setAppreciation(pct >= 0.8 ? "TB" : pct >= 0.6 ? "B" : pct >= 0.5 ? "AB" : "I");
                        note.setSemestre("S1"); note.setAnneeScol("2023-2024");
                        noteRepo.save(note);
                    }
                }
            }

            // ─── 6. BULLETINS S1 ────────────────────────────────────────────
            for (Map.Entry<String, List<Eleve>> entry : elevesParClasse.entrySet()) {
                List<Eleve> liste = entry.getValue();
                Map<Long, Double> moyennesMap = new LinkedHashMap<>();
                for (Eleve eleve : liste) {
                    List<Note> notes = noteRepo.findByEleveIdAndSemestreAndAnneeScol(eleve.getId(), "S1", "2023-2024");
                    double total = notes.stream().mapToDouble(n -> n.getTotal() != null ? n.getTotal() : 0).sum();
                    double moy = Math.round((total * 20.0 / totalMax) * 100.0) / 100.0;
                    moyennesMap.put(eleve.getId(), moy);
                }
                List<Map.Entry<Long, Double>> sorted = new ArrayList<>(moyennesMap.entrySet());
                sorted.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
                Map<Long, Integer> rangsMap = new LinkedHashMap<>();
                for (int i = 0; i < sorted.size(); i++) rangsMap.put(sorted.get(i).getKey(), i + 1);
                double moyenneClasse = Math.round(moyennesMap.values().stream().mapToDouble(v -> v).average().orElse(0) * 100.0) / 100.0;

                for (Eleve eleve : liste) {
                    double moy = moyennesMap.getOrDefault(eleve.getId(), 0.0);
                    Bulletin b = new Bulletin();
                    b.setEleve(eleve); b.setSemestre("S1"); b.setAnneeScol("2023-2024");
                    b.setMoyenne(moy); b.setMoyenneClasse(moyenneClasse);
                    b.setRang(rangsMap.getOrDefault(eleve.getId(), 0));
                    b.setAppreciation(getAppreciation(moy));
                    b.setDateGeneration(LocalDate.now());
                    b.setSigneEnseignant(true); b.setSigneDirecteur(true); b.setSigneParent(false);
                    bulletinRepo.save(b);
                }
            }

            // ─── 7. POINTAGES — 1 semaine seulement (lundi au vendredi) ────
            // Limité à 5 jours pour ne pas surcharger le démarrage
            LocalDate lundiRef = LocalDate.of(2023, 10, 9);
            String moisRef = "2023-10";

            for (int jour = 0; jour < 5; jour++) {
                LocalDate date = lundiRef.plusDays(jour);
                for (User ens : enseignantsList) {
                    StatutPresence statut = rnd.nextDouble() < 0.9 ? StatutPresence.PRESENT : StatutPresence.ABSENT;
                    Pointage p = new Pointage();
                    p.setEnseignant(ens); p.setDate(date); p.setStatut(statut);
                    p.setTypePointage("ENSEIGNANT"); p.setMois(moisRef); p.setAnneeScol("2023-2024");
                    if (statut == StatutPresence.ABSENT) p.setJustifie(rnd.nextBoolean());
                    if (statut == StatutPresence.PRESENT)
                        p.setHeureArrivee(java.time.LocalTime.of(7, 45).plusMinutes(rnd.nextInt(20)));
                    pointageRepo.save(p);
                }
                // Élèves CI seulement pour limiter le volume
                for (Eleve eleve : elevesParClasse.get("CI")) {
                    StatutPresence statut = rnd.nextDouble() < 0.95 ? StatutPresence.PRESENT : StatutPresence.ABSENT;
                    Pointage p = new Pointage();
                    p.setEleve(eleve); p.setClasse(eleve.getClasse());
                    p.setDate(date); p.setStatut(statut);
                    p.setTypePointage("ELEVE"); p.setMois(moisRef); p.setAnneeScol("2023-2024");
                    if (statut == StatutPresence.ABSENT) p.setJustifie(rnd.nextBoolean());
                    pointageRepo.save(p);
                }
            }

            // ─── 8. PAIEMENTS ELEVES ────────────────────────────────────────
            User encaisseur = userRepo.findByUsername("admin").orElse(null);
            double montantInscription = 15000;
            double montantScolarite   = 25000;

            for (Eleve e : eleveRepo.findAll()) {
                // Inscription
                PaiementEleve pi = new PaiementEleve();
                pi.setEleve(e); pi.setTypePaiement("INSCRIPTION"); pi.setAnneeScol("2023-2024");
                boolean inscPaye = rnd.nextDouble() < 0.85;
                pi.setMontantDu(montantInscription);
                pi.setMontantPaye(inscPaye ? montantInscription : 0.0);
                pi.setMontantRestant(inscPaye ? 0.0 : montantInscription);
                pi.setStatut(inscPaye ? StatutPaiement.PAYE : StatutPaiement.IMPAYE);
                if (inscPaye) {
                    pi.setDatePaiement(LocalDate.of(2023, 10, 1 + rnd.nextInt(15)));
                    pi.setModePaiement("ESPECES");
                    pi.setReferenceRecu("INS-" + e.getId());
                }
                pi.setDateEcheance(LocalDate.of(2023, 10, 31));
                pi.setEncaisseur(encaisseur);
                paiementRepo.save(pi);

                // Scolarité T1
                PaiementEleve pt1 = new PaiementEleve();
                pt1.setEleve(e); pt1.setTypePaiement("SCOLARITE_T1"); pt1.setTrimestre("T1");
                pt1.setAnneeScol("2023-2024");
                double dbl = rnd.nextDouble();
                double payeT1 = dbl < 0.7 ? montantScolarite : (dbl < 0.85 ? montantScolarite / 2 : 0);
                pt1.setMontantDu(montantScolarite); pt1.setMontantPaye(payeT1);
                pt1.setMontantRestant(montantScolarite - payeT1);
                pt1.setStatut(payeT1 >= montantScolarite ? StatutPaiement.PAYE : (payeT1 > 0 ? StatutPaiement.PARTIEL : StatutPaiement.IMPAYE));
                if (payeT1 > 0) {
                    pt1.setDatePaiement(LocalDate.of(2023, 10, 1 + rnd.nextInt(20)));
                    pt1.setModePaiement("ESPECES");
                }
                pt1.setDateEcheance(LocalDate.of(2023, 11, 30));
                pt1.setEncaisseur(encaisseur);
                paiementRepo.save(pt1);

                // Scolarité T2 (future)
                PaiementEleve pt2 = new PaiementEleve();
                pt2.setEleve(e); pt2.setTypePaiement("SCOLARITE_T2"); pt2.setTrimestre("T2");
                pt2.setAnneeScol("2023-2024");
                pt2.setMontantDu(montantScolarite); pt2.setMontantPaye(0.0);
                pt2.setMontantRestant(montantScolarite); pt2.setStatut(StatutPaiement.IMPAYE);
                pt2.setDateEcheance(LocalDate.of(2024, 2, 28));
                paiementRepo.save(pt2);
            }

            // ─── 9. CONFIGURATIONS SALAIRES & FICHES OCTOBRE ────────────────
            double[] salairesBase = {180000, 165000, 175000, 160000, 190000, 170000};
            for (int i = 0; i < enseignantsList.size(); i++) {
                User ens = enseignantsList.get(i);
                double base = salairesBase[i];
                double primeAnc = base * 0.05;
                double transport = 15000;
                double logement = (i % 2 == 0) ? 20000 : 0;

                ConfigurationSalaire cfg = new ConfigurationSalaire();
                cfg.setEnseignant(ens);
                cfg.setSalaireBase(base); cfg.setPrimeAnciennete(primeAnc);
                cfg.setIndemnitesTransport(transport); cfg.setIndemnitesLogement(logement);
                cfg.setAutresIndemnites(0.0); cfg.setAnneesAnciennete(2 + i);
                cfg.setNiveauQualification(i % 3 == 0 ? "LICENCE" : (i % 3 == 1 ? "BAC" : "BEPC"));
                cfg.setAnneeScol("2023-2024"); cfg.setActif(true);
                configSalaireRepo.save(cfg);

                // Fiche de paie Octobre 2023
                double brut = base + primeAnc + transport + logement;
                double cotIPRES = (base + primeAnc) * 0.084;
                double cotCSS   = (base + primeAnc) * 0.07;
                // Compter absences non justifiées
                long absNJ = pointageRepo.findByTypePointageAndMois("ENSEIGNANT", "2023-10").stream()
                        .filter(p -> p.getEnseignant() != null
                                && p.getEnseignant().getId().equals(ens.getId())
                                && p.getStatut() == StatutPresence.ABSENT
                                && !p.isJustifie())
                        .count();
                double deductAbs = (base / 26.0) * absNJ;
                double baseImp = brut - cotIPRES - cotCSS - deductAbs;
                double irpp = calcIRPP(baseImp);
                double net = brut - cotIPRES - cotCSS - irpp - deductAbs;

                SalaireProfesseur sal = new SalaireProfesseur();
                sal.setEnseignant(ens); sal.setMois("2023-10"); sal.setAnneeScol("2023-2024");
                sal.setSalaireBase(base); sal.setPrimeAnciennete(primeAnc);
                sal.setIndemnitesTransport(transport); sal.setIndemnitesLogement(logement);
                sal.setAutresIndemnites(0.0); sal.setPrimeSurperfomance(0.0);
                sal.setSalaireBrut(round2(brut));
                sal.setCotisationIPRES(round2(cotIPRES)); sal.setCotisationCSS(round2(cotCSS));
                sal.setImpotSurRevenu(round2(irpp)); sal.setAutresRetenues(0.0);
                sal.setJoursAbsenceNonJustifie((int) absNJ);
                sal.setDeductionAbsences(round2(deductAbs));
                sal.setSalaireNet(round2(net));
                sal.setStatut(StatutPaiement.PAYE); sal.setValide(true);
                sal.setDatePaiement(LocalDate.of(2023, 10, 28));
                sal.setModePaiement("VIREMENT");
                salaireRepo.save(sal);
            }

            System.out.println("✅ Données chargées avec succès !");
            System.out.println("   → " + eleveRepo.count() + " élèves");
            System.out.println("   → " + userRepo.count() + " utilisateurs");
            System.out.println("   → " + noteRepo.count() + " notes");
            System.out.println("   → " + bulletinRepo.count() + " bulletins");
            System.out.println("   → " + pointageRepo.count() + " pointages");
            System.out.println("   → " + paiementRepo.count() + " paiements");
            System.out.println("   → " + salaireRepo.count() + " fiches de paie");
            System.out.println("   → Login : admin / admin123  |  directeur / directeur123  |  enseignants / ecole123");

            seedParentPortalData(userRepo, eleveRepo, matiereRepo, noteRepo, devoirRepo, passwordEncoder);
        };
    }

    private void seedParentPortalData(
            UserRepository userRepo,
            EleveRepository eleveRepo,
            MatiereRepository matiereRepo,
            NoteRepository noteRepo,
            DevoirRepository devoirRepo,
            PasswordEncoder passwordEncoder
    ) {
        List<Eleve> eleves = eleveRepo.findAll();
        if (eleves.size() < 2) return;

        Eleve enfantMoussa = eleves.get(0);
        Eleve enfantAli = eleves.get(1);
        enfantMoussa.setNomPere("Moussa THIOUNE");
        enfantMoussa.setTelephoneParent("77 700 00 01");
        enfantAli.setNomPere("Ali DIALLO");
        enfantAli.setTelephoneParent("77 700 00 02");
        eleveRepo.save(enfantMoussa);
        eleveRepo.save(enfantAli);

        createOrUpdateParent(userRepo, enfantMoussa, passwordEncoder);
        createOrUpdateParent(userRepo, enfantAli, passwordEncoder);

        String anneeScol = currentSchoolYear();
        List<Matiere> matieres = matiereRepo.findAll();
        if (matieres.isEmpty()) return;

        createDemoNote(noteRepo, matieres.get(0), enfantMoussa, anneeScol, 8.0, 9.0);
        createDemoNote(noteRepo, matieres.get(0), enfantAli, anneeScol, 7.0, 8.5);

        if (devoirRepo.findByClasseIdAndAnneeScolOrderByDatePrevueAsc(
                enfantMoussa.getClasse().getId(), anneeScol).stream()
                .noneMatch(d -> "DEVOIR".equals(d.getType()) && "Devoir de lecture - test parent".equals(d.getTitre()))) {
            Devoir devoir = new Devoir();
            devoir.setTitre("Devoir de lecture - test parent");
            devoir.setDescription("Lire le texte distribué et répondre aux questions.");
            devoir.setType("DEVOIR");
            devoir.setDatePrevue(LocalDate.now().plusDays(7));
            devoir.setAnneeScol(anneeScol);
            devoir.setClasse(enfantMoussa.getClasse());
            devoir.setMatiere(matieres.get(0));
            devoirRepo.save(devoir);
        }

        if (devoirRepo.findByClasseIdAndAnneeScolOrderByDatePrevueAsc(
                enfantAli.getClasse().getId(), anneeScol).stream()
                .noneMatch(d -> "COMPOSITION".equals(d.getType()) && "Composition du trimestre - test parent".equals(d.getTitre()))) {
            Devoir composition = new Devoir();
            composition.setTitre("Composition du trimestre - test parent");
            composition.setDescription("Composition de synthèse du trimestre.");
            composition.setType("COMPOSITION");
            composition.setDatePrevue(LocalDate.now().plusDays(14));
            composition.setAnneeScol(anneeScol);
            composition.setClasse(enfantAli.getClasse());
            composition.setMatiere(matieres.get(Math.min(1, matieres.size() - 1)));
            devoirRepo.save(composition);
        }
    }

    private void removeLegacyRoleConstraints(JdbcTemplate jdbcTemplate) {
        List<String> constraints = jdbcTemplate.queryForList(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS "
                        + "WHERE TABLE_NAME = 'USERS' AND CONSTRAINT_TYPE = 'CHECK'",
                String.class);
        for (String constraint : constraints) {
            jdbcTemplate.execute("ALTER TABLE USERS DROP CONSTRAINT \"" + constraint + "\"");
        }
    }

    private void createOrUpdateParent(UserRepository userRepo, Eleve eleve, PasswordEncoder passwordEncoder) {
        String username = "parent_" + eleve.getMatricule();
        User parent = userRepo.findByUsername(username).orElseGet(User::new);
        parent.setUsername(username);
        if (parent.getPassword() == null) parent.setPassword(passwordEncoder.encode("parent123"));
        parent.setPrenom(eleve.getNomPere());
        parent.setNom(eleve.getNom());
        parent.setTelephone(eleve.getTelephoneParent());
        parent.setRole(Role.PARENT);
        parent.setActif(true);
        parent.setParentEleve(eleve);
        userRepo.save(parent);
        System.out.println("   → Parent : " + parent.getPrenom() + " | matricule " + eleve.getMatricule()
                + " | téléphone " + eleve.getTelephoneParent());
    }

    private void createDemoNote(NoteRepository noteRepo, Matiere matiere, Eleve eleve,
                                String anneeScol, double ressources, double competences) {
        Note note = noteRepo.findByEleveIdAndMatiereIdAndSemestreAndAnneeScol(
                eleve.getId(), matiere.getId(), "S1", anneeScol).orElseGet(Note::new);
        note.setEleve(eleve);
        note.setMatiere(matiere);
        note.setSemestre("S1");
        note.setAnneeScol(anneeScol);
        note.setNoteRessources(ressources);
        note.setNoteCompetences(competences);
        note.computeTotal();
        noteRepo.save(note);
    }

    private String currentSchoolYear() {
        LocalDate today = LocalDate.now();
        int startYear = today.getMonthValue() >= 9 ? today.getYear() : today.getYear() - 1;
        return startYear + "-" + (startYear + 1);
    }

    private double calcIRPP(double base) {
        if (base <= 41667) return 0;
        if (base <= 100000) return (base - 41667) * 0.20;
        if (base <= 166667) return 11667 + (base - 100000) * 0.30;
        return 31667 + (base - 166667) * 0.35;
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private String getAppreciation(double moyenne) {
        if (moyenne >= 18) return "Excellent";
        if (moyenne >= 16) return "Très Bien";
        if (moyenne >= 14) return "Bien";
        if (moyenne >= 12) return "Assez Bien";
        if (moyenne >= 10) return "Passable";
        return "Insuffisant";
    }
}
