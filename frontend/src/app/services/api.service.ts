import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Eleve, User, Classe, Matiere, Note, Bulletin,
         PointageLigne, RapportPointage, PaiementEleve, PaiementStats,
         ConfigurationSalaire, SalaireProfesseur,
         Notification, NotificationStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Eleves
  getEleves(classeId?: number, anneeScol?: string): Observable<Eleve[]> {
    let params = new HttpParams();
    if (classeId) params = params.set('classeId', classeId);
    if (anneeScol) params = params.set('anneeScol', anneeScol);
    return this.http.get<Eleve[]>(`${this.api}/eleves`, { params });
  }
  getEleve(id: number): Observable<Eleve> { return this.http.get<Eleve>(`${this.api}/eleves/${id}`); }
  createEleve(data: any): Observable<any> { return this.http.post<any>(`${this.api}/eleves`, data); }
  updateEleve(id: number, eleve: any): Observable<Eleve> { return this.http.put<Eleve>(`${this.api}/eleves/${id}`, eleve); }
  deleteEleve(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/eleves/${id}`); }
  importEleves(file: File, classeId: number, anneeScol: string): Observable<any> {
    const fd = new FormData();
    fd.append('file', file); fd.append('classeId', classeId.toString()); fd.append('anneeScol', anneeScol);
    return this.http.post(`${this.api}/eleves/import`, fd);
  }

  // Users
  getUsers(role?: string): Observable<User[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<User[]>(`${this.api}/users`, { params });
  }
  createUser(user: any): Observable<User> { return this.http.post<User>(`${this.api}/users`, user); }
  updateUser(id: number, user: any): Observable<User> { return this.http.put<User>(`${this.api}/users/${id}`, user); }
  deleteUser(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/users/${id}`); }

  // Classes
  getClasses(): Observable<Classe[]> { return this.http.get<Classe[]>(`${this.api}/classes`); }

  // Matieres
  getMatieres(): Observable<Matiere[]> { return this.http.get<Matiere[]>(`${this.api}/matieres`); }

  // Notes
  getNotes(eleveId: number, semestre: string, anneeScol: string): Observable<Note[]> {
    const params = new HttpParams().set('eleveId', eleveId).set('semestre', semestre).set('anneeScol', anneeScol);
    return this.http.get<Note[]>(`${this.api}/notes`, { params });
  }
  getNotesByClasse(classeId: number, semestre: string, anneeScol: string): Observable<Note[]> {
    const params = new HttpParams().set('classeId', classeId).set('semestre', semestre).set('anneeScol', anneeScol);
    return this.http.get<Note[]>(`${this.api}/notes/classe`, { params });
  }
  saveNote(note: any): Observable<Note> { return this.http.post<Note>(`${this.api}/notes`, note); }
  saveBatchNotes(notes: any[]): Observable<Note[]> { return this.http.post<Note[]>(`${this.api}/notes/batch`, notes); }
  importNotes(file: File, classeId: number, semestre: string, anneeScol: string): Observable<any> {
    const fd = new FormData();
    fd.append('file', file); fd.append('classeId', classeId.toString());
    fd.append('semestre', semestre); fd.append('anneeScol', anneeScol);
    return this.http.post(`${this.api}/notes/import`, fd);
  }

  // Bulletins
  getBulletins(params: any): Observable<Bulletin[]> {
    let p = new HttpParams();
    Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<Bulletin[]>(`${this.api}/bulletins`, { params: p });
  }
  getBulletinDetails(id: number): Observable<any> { return this.http.get(`${this.api}/bulletins/${id}/details`); }
  generateBulletins(classeId: number, semestre: string, anneeScol: string): Observable<any> {
    return this.http.post(`${this.api}/bulletins/generate`, { classeId, semestre, anneeScol });
  }
  signerBulletin(id: number, signatures: any): Observable<Bulletin> {
    return this.http.put<Bulletin>(`${this.api}/bulletins/${id}/signer`, signatures);
  }

  // ── POINTAGES ──────────────────────────────────────────────────────────
  getPointageClasse(classeId: number, date: string): Observable<PointageLigne[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<PointageLigne[]>(`${this.api}/pointages/eleves/classe/${classeId}`, { params });
  }
  savePointageBatch(data: any): Observable<any> {
    return this.http.post(`${this.api}/pointages/eleves/batch`, data);
  }
  getStatsEleve(eleveId: number, mois: string): Observable<any> {
    const params = new HttpParams().set('mois', mois);
    return this.http.get(`${this.api}/pointages/eleves/${eleveId}/stats`, { params });
  }
  getRapportMensuelClasse(classeId: number, mois: string): Observable<RapportPointage[]> {
    const params = new HttpParams().set('mois', mois);
    return this.http.get<RapportPointage[]>(`${this.api}/pointages/eleves/rapport/classe/${classeId}`, { params });
  }
  getPointageEnseignants(date: string): Observable<PointageLigne[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<PointageLigne[]>(`${this.api}/pointages/enseignants`, { params });
  }
  savePointageEnseignants(data: any): Observable<any> {
    return this.http.post(`${this.api}/pointages/enseignants/batch`, data);
  }
  getStatsEnseignant(enseignantId: number, mois: string): Observable<any> {
    const params = new HttpParams().set('mois', mois);
    return this.http.get(`${this.api}/pointages/enseignants/${enseignantId}/stats`, { params });
  }
  getRapportMensuelEnseignants(mois: string): Observable<RapportPointage[]> {
    const params = new HttpParams().set('mois', mois);
    return this.http.get<RapportPointage[]>(`${this.api}/pointages/enseignants/rapport`, { params });
  }

  // ── PAIEMENTS ÉLÈVES ───────────────────────────────────────────────────
  getPaiements(params: any): Observable<PaiementEleve[]> {
    let p = new HttpParams();
    Object.keys(params).forEach(k => { if (params[k] != null) p = p.set(k, params[k]); });
    return this.http.get<PaiementEleve[]>(`${this.api}/paiements`, { params: p });
  }
  createPaiement(data: any): Observable<PaiementEleve> {
    return this.http.post<PaiementEleve>(`${this.api}/paiements`, data);
  }
  updatePaiement(id: number, data: any): Observable<PaiementEleve> {
    return this.http.put<PaiementEleve>(`${this.api}/paiements/${id}`, data);
  }
  deletePaiement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/paiements/${id}`);
  }
  getPaiementStats(anneeScol: string): Observable<PaiementStats> {
    const params = new HttpParams().set('anneeScol', anneeScol);
    return this.http.get<PaiementStats>(`${this.api}/paiements/stats`, { params });
  }

  getParentPortal(): Observable<any> {
    return this.http.get(`${this.api}/parent/portal`);
  }
  inscrireClasse(data: any): Observable<any> {
    return this.http.post(`${this.api}/paiements/inscrire-classe`, data);
  }
  getRapportPaiementsJournalier(date: string, anneeScol: string): Observable<any> {
    const params = new HttpParams().set('date', date).set('anneeScol', anneeScol);
    return this.http.get(`${this.api}/paiements/rapport-journalier`, { params });
  }

  // ── SALAIRES ──────────────────────────────────────────────────────────
  getSalaires(params?: any): Observable<SalaireProfesseur[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<SalaireProfesseur[]>(`${this.api}/salaires`, { params: p });
  }
  getSalaireById(id: number): Observable<SalaireProfesseur> {
    return this.http.get<SalaireProfesseur>(`${this.api}/salaires/${id}`);
  }
  genererFichesPaie(data: any): Observable<any> {
    return this.http.post(`${this.api}/salaires/generer`, data);
  }
  payerSalaire(id: number, data: any): Observable<SalaireProfesseur> {
    return this.http.put<SalaireProfesseur>(`${this.api}/salaires/${id}/payer`, data);
  }
  validerSalaire(id: number, data: any): Observable<SalaireProfesseur> {
    return this.http.put<SalaireProfesseur>(`${this.api}/salaires/${id}/valider`, data);
  }
  getSalaireStats(anneeScol: string, mois?: string): Observable<any> {
    let p = new HttpParams().set('anneeScol', anneeScol);
    if (mois) p = p.set('mois', mois);
    return this.http.get(`${this.api}/salaires/stats`, { params: p });
  }
  getConfigsSalaires(): Observable<ConfigurationSalaire[]> {
    return this.http.get<ConfigurationSalaire[]>(`${this.api}/salaires/configs`);
  }
  saveConfigSalaire(data: any): Observable<ConfigurationSalaire> {
    return this.http.post<ConfigurationSalaire>(`${this.api}/salaires/configs`, data);
  }

  // ── CLASSES ──────────────────────────────────────────────────────────
  createClasse(data: { nom: string }): Observable<Classe> {
    return this.http.post<Classe>(`${this.api}/classes`, data);
  }
  updateClasse(id: number, data: any): Observable<Classe> {
    return this.http.put<Classe>(`${this.api}/classes/${id}`, data);
  }
  deleteClasse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/classes/${id}`);
  }

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────
  getNotifications(anneeScol?: string): Observable<Notification[]> {
    let params = new HttpParams();
    if (anneeScol) params = params.set('anneeScol', anneeScol);
    return this.http.get<Notification[]>(`${this.api}/notifications`, { params });
  }
  getNotificationStats(): Observable<NotificationStats> {
    return this.http.get<NotificationStats>(`${this.api}/notifications/stats`);
  }
  notifierBulletins(classeId: number, semestre: string, anneeScol: string): Observable<any> {
    return this.http.post(`${this.api}/notifications/bulletins`, { classeId, semestre, anneeScol });
  }
  notifierPaiementsFinMois(mois: string, anneeScol: string): Observable<any> {
    return this.http.post(`${this.api}/notifications/paiements-fin-mois`, { mois, anneeScol });
  }
  notifierGeneral(sujet: string, message: string, anneeScol: string): Observable<any> {
    return this.http.post(`${this.api}/notifications/general`, { sujet, message, anneeScol });
  }
}
