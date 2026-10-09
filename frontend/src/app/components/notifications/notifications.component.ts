import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Notification as Notif, NotificationStats, Classe } from '../../models/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4">

  <!-- Header -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h3 class="fw-bold mb-1">📧 Notifications Parents</h3>
      <p class="text-muted mb-0">Envoi d'emails automatiques aux parents d'élèves</p>
    </div>
    <div class="badge bg-info fs-6 p-2">
      <i class="bi bi-wifi me-1"></i>
      {{ stats?.envoyes || 0 }} emails envoyés
    </div>
  </div>

  <!-- Stats -->
  <div class="row g-3 mb-4" *ngIf="stats">
    <div class="col-md-3 col-6">
      <div class="card border-0 shadow-sm text-center p-3">
        <div class="fs-2 mb-1">📨</div>
        <div class="fs-3 fw-bold text-primary">{{ stats.total }}</div>
        <small class="text-muted">Total notifications</small>
      </div>
    </div>
    <div class="col-md-3 col-6">
      <div class="card border-0 shadow-sm text-center p-3">
        <div class="fs-2 mb-1">✅</div>
        <div class="fs-3 fw-bold text-success">{{ stats.envoyes }}</div>
        <small class="text-muted">Envoyés</small>
      </div>
    </div>
    <div class="col-md-3 col-6">
      <div class="card border-0 shadow-sm text-center p-3">
        <div class="fs-2 mb-1">❌</div>
        <div class="fs-3 fw-bold text-danger">{{ stats.echecs }}</div>
        <small class="text-muted">Échecs</small>
      </div>
    </div>
    <div class="col-md-3 col-6">
      <div class="card border-0 shadow-sm text-center p-3">
        <div class="fs-2 mb-1">📋</div>
        <div class="fs-3 fw-bold text-purple">{{ stats.bulletins }}</div>
        <small class="text-muted">Bulletins</small>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="row g-4 mb-4">

    <!-- Bulletins -->
    <div class="col-md-6">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="fs-3">📋</span>
            <div>
              <h5 class="mb-0 fw-bold">Bulletins de Notes</h5>
              <small class="text-muted">Envoyer les résultats du semestre aux parents</small>
            </div>
          </div>
          <hr>
          <div class="row g-2 mb-3">
            <div class="col-12">
              <label class="form-label small fw-semibold">Classe *</label>
              <select class="form-select form-select-sm" [(ngModel)]="bForm.classeId">
                <option value="">— Sélectionner une classe —</option>
                <option *ngFor="let c of classes" [value]="c.id">
                  {{ c.nom }} ({{ c.effectifs || 0 }} élèves)
                </option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label small fw-semibold">Semestre</label>
              <select class="form-select form-select-sm" [(ngModel)]="bForm.semestre">
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label small fw-semibold">Année scolaire</label>
              <input class="form-control form-control-sm" [(ngModel)]="bForm.anneeScol" placeholder="2023-2024">
            </div>
          </div>
          <div class="alert alert-warning small py-2" *ngIf="!bForm.classeId">
            <i class="bi bi-exclamation-triangle me-1"></i>
            Les bulletins doivent être générés avant l'envoi
          </div>
          <button class="btn btn-primary w-100" (click)="envoyerBulletins()"
                  [disabled]="loadingB || !bForm.classeId">
            <span *ngIf="loadingB" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!loadingB" class="bi bi-send me-1"></i>
            {{ loadingB ? 'Envoi en cours...' : 'Envoyer aux parents' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Fin de mois -->
    <div class="col-md-6">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="fs-3">💰</span>
            <div>
              <h5 class="mb-0 fw-bold">Rappels de Paiement</h5>
              <small class="text-muted">Fin de mois — élèves avec impayés</small>
            </div>
          </div>
          <hr>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label small fw-semibold">Mois *</label>
              <input type="month" class="form-control form-control-sm" [(ngModel)]="pForm.mois">
            </div>
            <div class="col-6">
              <label class="form-label small fw-semibold">Année scolaire</label>
              <input class="form-control form-control-sm" [(ngModel)]="pForm.anneeScol" placeholder="2023-2024">
            </div>
          </div>
          <div class="alert alert-info small py-2">
            <i class="bi bi-info-circle me-1"></i>
            Seuls les parents d'élèves avec un email renseigné recevront le rappel
          </div>
          <button class="btn btn-warning w-100 text-dark" (click)="envoyerPaiements()"
                  [disabled]="loadingP || !pForm.mois">
            <span *ngIf="loadingP" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!loadingP" class="bi bi-send me-1"></i>
            {{ loadingP ? 'Envoi en cours...' : 'Envoyer rappels' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Message général -->
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="fs-3">📢</span>
            <div>
              <h5 class="mb-0 fw-bold">Message Général</h5>
              <small class="text-muted">Envoyer un message à tous les parents de l'école</small>
            </div>
          </div>
          <hr>
          <div class="row g-2 mb-3">
            <div class="col-md-8">
              <label class="form-label small fw-semibold">Objet *</label>
              <input class="form-control form-control-sm" [(ngModel)]="gForm.sujet"
                     placeholder="ex: Réunion parents d'élèves, Fermeture exceptionnelle…">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-semibold">Année scolaire</label>
              <input class="form-control form-control-sm" [(ngModel)]="gForm.anneeScol" placeholder="2023-2024">
            </div>
            <div class="col-12">
              <label class="form-label small fw-semibold">Message *</label>
              <textarea class="form-control" [(ngModel)]="gForm.message" rows="3"
                        placeholder="Contenu du message aux parents…"></textarea>
            </div>
          </div>
          <button class="btn btn-success" (click)="envoyerGeneral()"
                  [disabled]="loadingG || !gForm.sujet || !gForm.message">
            <span *ngIf="loadingG" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!loadingG" class="bi bi-broadcast me-1"></i>
            {{ loadingG ? 'Envoi en cours...' : 'Envoyer à tous les parents' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Résultat -->
  <div class="alert d-flex align-items-start gap-3 mb-4" *ngIf="lastResult"
       [class.alert-success]="lastResult.ok" [class.alert-danger]="!lastResult.ok">
    <span class="fs-4 flex-shrink-0">{{ lastResult.ok ? '✅' : '❌' }}</span>
    <div class="flex-grow-1">
      <strong class="d-block">{{ lastResult.titre }}</strong>
      <span>{{ lastResult.message }}</span>
      <small class="d-block text-muted mt-1" *ngIf="lastResult.details">{{ lastResult.details }}</small>
    </div>
    <button class="btn-close" (click)="lastResult=null"></button>
  </div>

  <!-- Historique -->
  <div class="card border-0 shadow-sm">
    <div class="card-header bg-white d-flex justify-content-between align-items-center">
      <h6 class="mb-0 fw-bold">📜 Historique des notifications</h6>
      <button class="btn btn-sm btn-outline-secondary" (click)="loadAll()">
        <i class="bi bi-arrow-clockwise me-1"></i>Actualiser
      </button>
    </div>
    <div class="table-responsive">
      <table class="table table-hover mb-0" *ngIf="notifs.length > 0">
        <thead style="background:#f8f9fa; font-size:.8rem;">
          <tr>
            <th>Type</th>
            <th>Élève</th>
            <th>Email parent</th>
            <th>Sujet</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let n of notifs">
            <td>
              <span class="badge" [class]="typeBadge(n.type)">{{ typeLabel(n.type) }}</span>
            </td>
            <td class="small">{{ n.eleve ? (n.eleve.prenom + ' ' + n.eleve.nom) : '—' }}</td>
            <td class="small text-muted">{{ n.destinatireEmail || '—' }}</td>
            <td class="small" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              {{ n.sujet }}
            </td>
            <td>
              <span *ngIf="n.statut==='ENVOYE'" class="text-success small fw-semibold">
                <i class="bi bi-check-circle me-1"></i>Envoyé
              </span>
              <span *ngIf="n.statut==='ECHEC'" class="text-danger small fw-semibold">
                <i class="bi bi-x-circle me-1"></i>Échec
              </span>
              <span *ngIf="n.statut==='EN_ATTENTE'" class="text-warning small fw-semibold">
                <i class="bi bi-clock me-1"></i>En attente
              </span>
            </td>
            <td class="small text-muted">{{ n.dateCreation | date:'dd/MM/yy HH:mm' }}</td>
          </tr>
        </tbody>
      </table>
      <div class="text-center text-muted py-5" *ngIf="notifs.length === 0 && !loadingList">
        <i class="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
        Aucune notification envoyée pour le moment
      </div>
      <div class="text-center py-4" *ngIf="loadingList">
        <div class="spinner-border text-success"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .text-purple { color: #6f42c1 !important; }
</style>
  `,
})
export class NotificationsComponent implements OnInit {
  classes: Classe[] = [];
  notifs: Notif[] = [];
  stats: NotificationStats | null = null;

  bForm = { classeId: '', semestre: 'S1', anneeScol: '2023-2024' };
  pForm = { mois: '', anneeScol: '2023-2024' };
  gForm = { sujet: '', message: '', anneeScol: '2023-2024' };

  loadingB = false; loadingP = false; loadingG = false; loadingList = false;
  lastResult: { ok: boolean; titre: string; message: string; details?: string } | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getClasses().subscribe(c => this.classes = c);
    this.loadAll();
  }

  loadAll() {
    this.loadingList = true;
    this.api.getNotifications().subscribe({
      next: n => { this.notifs = n; this.loadingList = false; },
      error: () => this.loadingList = false
    });
    this.api.getNotificationStats().subscribe({
      next: s => this.stats = s,
      error: () => {}
    });
  }

  envoyerBulletins() {
    if (!this.bForm.classeId) return;
    this.loadingB = true;
    this.api.notifierBulletins(+this.bForm.classeId, this.bForm.semestre, this.bForm.anneeScol).subscribe({
      next: (r: any) => {
        this.loadingB = false;
        this.lastResult = {
          ok: true, titre: '✅ Bulletins envoyés',
          message: r.message,
          details: `Total : ${r.total} parents contactés — ${r.echecs || 0} échec(s)`
        };
        this.loadAll();
      },
      error: (err) => {
        this.loadingB = false;
        this.lastResult = { ok: false, titre: 'Erreur', message: err.error?.message || 'Une erreur est survenue' };
      }
    });
  }

  envoyerPaiements() {
    if (!this.pForm.mois) return;
    this.loadingP = true;
    this.api.notifierPaiementsFinMois(this.pForm.mois, this.pForm.anneeScol).subscribe({
      next: (r: any) => {
        this.loadingP = false;
        this.lastResult = {
          ok: true, titre: '✅ Rappels envoyés',
          message: r.message,
          details: `${r.elevesImpayes} élève(s) avec impayés — ${r.envoyes} email(s) transmis`
        };
        this.loadAll();
      },
      error: (err) => {
        this.loadingP = false;
        this.lastResult = { ok: false, titre: 'Erreur', message: err.error?.message || 'Erreur lors de l\'envoi' };
      }
    });
  }

  envoyerGeneral() {
    if (!this.gForm.sujet || !this.gForm.message) return;
    this.loadingG = true;
    this.api.notifierGeneral(this.gForm.sujet, this.gForm.message, this.gForm.anneeScol).subscribe({
      next: (r: any) => {
        this.loadingG = false;
        this.gForm.sujet = ''; this.gForm.message = '';
        this.lastResult = { ok: true, titre: '✅ Message envoyé', message: r.message };
        this.loadAll();
      },
      error: (err) => {
        this.loadingG = false;
        this.lastResult = { ok: false, titre: 'Erreur', message: err.error?.message || 'Erreur' };
      }
    });
  }

  typeBadge(type: string): string {
    const m: Record<string, string> = {
      BULLETIN: 'bg-primary', PAIEMENT_FIN_MOIS: 'bg-warning text-dark',
      ABSENCE: 'bg-danger', GENERAL: 'bg-secondary'
    };
    return 'badge ' + (m[type] || 'bg-secondary');
  }

  typeLabel(type: string): string {
    const m: Record<string, string> = {
      BULLETIN: '📋 Bulletin', PAIEMENT_FIN_MOIS: '💰 Paiement',
      ABSENCE: '🚫 Absence', GENERAL: '📢 Général'
    };
    return m[type] || type;
  }
}
