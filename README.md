cd ba# 🏫 Système de Gestion Scolaire — Institut Annour, Diourbel

Application de gestion des écoles primaires au Sénégal (CI au CM2), conforme au système éducatif national.

## 📋 Fonctionnalités

### Gestion des Élèves
- Inscription individuelle avec tous les champs requis (identité, parents, contacts)
- **Import en masse** via fichier Excel (.xlsx)
- Génération automatique du matricule
- Mise à jour et suppression logique

### Gestion du Personnel
- Création d'enseignants, directeurs, administrateurs
- Association enseignant ↔ classe
- Gestion des mots de passe sécurisés (BCrypt)

### Saisie des Notes
- Grille de saisie par classe, semestre et année scolaire
- Notes en **Ressources** et **Compétences** pour chaque discipline
- Calcul automatique du total et de la moyenne
- **Import Excel** pour saisie en masse
- Appréciations automatiques (Excellent → Insuffisant)

### Génération des Bulletins
- Calcul automatique des moyennes, rangs et moyenne de classe
- Bulletins conformes au format officiel sénégalais
- Vue imprimable prête à l'emploi
- Suivi des signatures (Enseignant / Directeur / Parent)

### Disciplines évaluées
| Discipline | Note max |
|-----------|---------|
| Langue et Communication | 20 |
| Découverte du Monde | 30 |
| Développement Durable | 20 |
| Mathématique | 40 |
| Education Artistique | 5 |
| Chant / Récitation | 5 |
| **Total** | **120** |

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Backend | Spring Boot 3.2, Spring Security (JWT), Spring Data JPA |
| Base de données | H2 (dev) / PostgreSQL (prod) |
| Frontend | Angular 17 (Standalone Components) |
| UI | Bootstrap 5.3 + Bootstrap Icons |
| Import Excel | Apache POI (backend) |
| Sécurité | JWT + BCrypt |

## 🚀 Démarrage rapide

### Option 1 : Docker Compose (recommandé)
```bash
cd school-app
docker-compose up --build
```
Accès : http://localhost:4200

### Option 2 : Démarrage manuel

**Backend** (Java 17+ requis) :
```bash
cd backend
./mvnw spring-boot:run
```
API disponible sur http://localhost:8080

**Frontend** (Node 18+ requis) :
```bash
cd frontend
npm install
ng serve
```
Frontend sur http://localhost:4200

## 🔑 Identifiants par défaut

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Administrateur | `admin` | `admin123` |

> ⚠️ Changez le mot de passe admin en production !

## 🔒 Sécurité

- Authentification JWT (token valable 24h)
- Mots de passe hachés avec BCrypt
- CORS configuré pour localhost:4200
- Endpoints protégés par rôle (ADMIN, DIRECTEUR, ENSEIGNANT)

## 📊 Format des fichiers Excel

### Import élèves
Voir `FORMAT_IMPORT.txt` pour le détail des colonnes.

Colonnes : Prénom | Nom | DateNaissance (YYYY-MM-DD) | LieuNaissance | Sexe (M/F) | NomPere | NomMere | Téléphone | Adresse

### Import notes
Colonnes : Matricule | Prénom | Nom | [Pour chaque matière: Ressources | Compétences]

## 🗄️ Base de données

En développement, une base H2 en mémoire est utilisée.
Console H2 disponible sur : http://localhost:8080/h2-console
- JDBC URL : `jdbc:h2:mem:ecoledb`
- Username : `sa`
- Password : (vide)

### Migration vers PostgreSQL
Dans `application.properties`, remplacez :
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ecoledb
spring.datasource.username=postgres
spring.datasource.password=votre_mot_de_passe
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

## 📱 Captures d'écran

- **Dashboard** : Vue d'ensemble avec statistiques et effectifs par classe
- **Élèves** : Liste avec recherche, filtres, formulaire d'inscription et import Excel
- **Enseignants** : Cartes personnel avec assignation aux classes
- **Notes** : Grille de saisie (type tableur) avec calcul automatique
- **Bulletins** : Génération, consultation et impression au format officiel

## 🇸🇳 Conformité Sénégal

Le système est conforme aux spécifications du Ministère de l'Éducation Nationale du Sénégal :
- Classes CI, CP, CE1, CE2, CM1, CM2
- Disciplines et barèmes officiels
- Format bulletin avec identité complète, rang, moyenne, appréciations
- Signatures triplées (Enseignant, Directeur, Parent)
- Gestion par semestre ou trimestre
- Données IEF/IA de Diourbel

## Dans le formulaire de la creation de leleve ajouter aussi optionnal lecole dorigine si oui les notes des deux semestres
## Ajouter la  facture profomat qui iclut la somme  de l'inscription jusqu'au dernier mois des linscription de leleve et elle est impimable et qui s'affichera aussi au porteill du parent
## AJouter aussi la partie CIN Scolaire qui contiendra les info de leleves aussi des linscription qui est aussi imprimable et qui s'affichera aussi au porteill du parent