export type UserRole = 'ADMIN' | 'DIRECTEUR' | 'ENSEIGNANT' | 'SURVEILLANT' | 'SECRETAIRE';

export interface User {
  id?: number;
  username: string;
  password?: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  role: UserRole;
  classe?: Classe;
  classeId?: number;
  actif?: boolean;
}

export interface Classe {
  id?: number;
  nom?: string;
  effectifs?: number;
}

export interface Eleve {
  id?: number;
  prenom: string;
  nom: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  sexe?: string;
  nomPere?: string;
  nomMere?: string;
  telephoneParent?: string;
  emailParent?: string;   // ← nouveau : pour les notifications
  adresse?: string;
  classe?: Classe;
  classeId?: number;
  anneeScol: string;
  matricule?: string;
  actif?: boolean;
  // ── École d'origine (optionnel) ─────────────────────────────────────
  ecoleOrigine?: string;
  classeAnneePrecedente?: string;
  notesOrigineS1?: string;
  notesOrigineS2?: string;

  // ── Frais d'inscription / scolarité ──────────────────────────────────
  montantInscription?: number;
  montantMensuel?: number;
  sommeVerseJuillet?: number;
}

export interface Matiere {
  id?: number;
  nom: string;
  noteMax: number;
  ordre?: number;
}

export interface Note {
  id?: number;
  eleve?: Eleve;
  eleveId?: number;
  matiere?: Matiere;
  matiereId?: number;
  noteRessources?: number;
  noteCompetences?: number;
  total?: number;
  appreciation?: string;
  semestre: string;
  anneeScol: string;
}

export interface Bulletin {
  id?: number;
  eleve?: Eleve;
  semestre: string;
  anneeScol: string;
  moyenne?: number;
  moyenneClasse?: number;
  rang?: number;
  appreciation?: string;
  commentaireEnseignant?: string;
  dateGeneration?: string;
  signeEnseignant?: boolean;
  signeDirecteur?: boolean;
  signeParent?: boolean;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

// ─── Pointage ───────────────────────────────────────────────────────────────
export interface PointageLigne {
  eleveId?: number;
  enseignantId?: number;
  prenom: string;
  nom: string;
  matricule?: string;
  classe?: string;
  pointageId?: number;
  statut: 'PRESENT' | 'ABSENT' | 'RETARD' | 'CONGE';
  motifAbsence?: string;
  justifie?: boolean;
  heureArrivee?: string;
  heureDepart?: string;
}

export interface PointageStats {
  presents: number;
  absents: number;
  retards: number;
  conges: number;
  total: number;
  joursOuvres?: number;
}

export interface RapportPointage {
  eleveId?: number;
  enseignantId?: number;
  prenom: string;
  nom: string;
  matricule?: string;
  classe?: string;
  presents: number;
  absents: number;
  retards: number;
  total: number;
  joursOuvres?: number;
}

// ─── Paiements ──────────────────────────────────────────────────────────────
export interface PaiementEleve {
  id?: number;
  eleve?: Eleve;
  eleveId?: number;
  typePaiement: string;
  trimestre?: string;
  montantDu?: number;
  montantPaye?: number;
  montantRestant?: number;
  statut?: 'PAYE' | 'PARTIEL' | 'IMPAYE';
  datePaiement?: string;
  dateEcheance?: string;
  modePaiement?: string;
  referenceRecu?: string;
  anneeScol: string;
  notes?: string;
}

export interface PaiementStats {
  totalEncaisse: number;
  totalRestant: number;
  nbImpayes: number;
  nbTotal: number;
}

// ─── Salaires ───────────────────────────────────────────────────────────────
export interface ConfigurationSalaire {
  id?: number;
  enseignant?: User;
  enseignantId?: number;
  salaireBase?: number;
  primeAnciennete?: number;
  indemnitesTransport?: number;
  indemnitesLogement?: number;
  autresIndemnites?: number;
  anneesAnciennete?: number;
  niveauQualification?: string;
  anneeScol?: string;
}

export interface SalaireProfesseur {
  id?: number;
  enseignant?: User;
  mois: string;
  anneeScol: string;
  salaireBase?: number;
  primeAnciennete?: number;
  indemnitesTransport?: number;
  indemnitesLogement?: number;
  autresIndemnites?: number;
  salaireBrut?: number;
  cotisationIPRES?: number;
  cotisationCSS?: number;
  impotSurRevenu?: number;
  joursAbsenceNonJustifie?: number;
  deductionAbsences?: number;
  salaireNet?: number;
  statut?: 'PAYE' | 'PARTIEL' | 'IMPAYE';
  datePaiement?: string;
  modePaiement?: string;
  referenceVirement?: string;
  valide?: boolean;
  observations?: string;
}

// ─── Notifications ──────────────────────────────────────────────────────────
export interface Notification {
  id?: number;
  type: 'BULLETIN' | 'PAIEMENT_FIN_MOIS' | 'ABSENCE' | 'GENERAL';
  sujet: string;
  message: string;
  destinatireEmail?: string;
  destinatireNom?: string;
  eleve?: Eleve;
  envoyeEmail?: boolean;
  dateEnvoi?: string;
  dateCreation?: string;
  statut?: 'ENVOYE' | 'ECHEC' | 'EN_ATTENTE';
  anneeScol?: string;
  mois?: string;
  semestre?: string;
}

export interface NotificationStats {
  total: number;
  envoyes: number;
  echecs: number;
  bulletins: number;
  paiements: number;
}
