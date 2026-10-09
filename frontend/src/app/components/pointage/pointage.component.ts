import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Classe, PointageLigne, RapportPointage } from '../../models/models';

@Component({
  selector: 'app-pointage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Gestion des Présences</h3>
          <p class="text-muted mb-0">Pointage quotidien élèves & enseignants</p>
        </div>
        <div class="d-flex gap-2">
          <input type="date" class="form-control" [(ngModel)]="selectedDate" (change)="onDateChange()" style="width:180px">
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'eleves'" (click)="activeTab='eleves'" href="javascript:void(0)">
            <i class="bi bi-people me-1"></i>Élèves
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'enseignants'" (click)="activeTab='enseignants'; loadEnseignants()" href="javascript:void(0)">
            <i class="bi bi-person-badge me-1"></i>Enseignants
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'rapport'" (click)="activeTab='rapport'" href="javascript:void(0)">
            <i class="bi bi-bar-chart me-1"></i>Rapport mensuel
          </a>
        </li>
      </ul>

      <!-- TAB ELEVES -->
      <div *ngIf="activeTab === 'eleves'">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body py-2">
            <div class="row g-2 align-items-center">
              <div class="col-md-3">
                <select class="form-select form-select-sm" [(ngModel)]="selectedClasse" (change)="loadPointageEleves()">
                  <option value="">— Sélectionner une classe —</option>
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <span class="badge bg-success me-1">{{ countStatut('PRESENT') }} Présents</span>
                <span class="badge bg-danger me-1">{{ countStatut('ABSENT') }} Absents</span>
                <span class="badge bg-warning text-dark">{{ countStatut('RETARD') }} Retards</span>
              </div>
              <div class="col-md-3 ms-auto d-flex gap-2 justify-content-end">
                <button class="btn btn-outline-success btn-sm" (click)="marquerTous('PRESENT')">
                  <i class="bi bi-check-all"></i> Tous présents
                </button>
                <button class="btn btn-success btn-sm" (click)="sauvegarderEleves()" [disabled]="saving || !selectedClasse">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!saving" class="bi bi-save me-1"></i>Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm" *ngIf="selectedClasse">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead style="background: #1a6b3c; color: white;">
                <tr>
                  <th style="width:40px">#</th>
                  <th>Élève</th>
                  <th>Matricule</th>
                  <th class="text-center">Présent</th>
                  <th class="text-center">Absent</th>
                  <th class="text-center">Retard</th>
                  <th class="text-center">Congé</th>
                  <th>Motif / Heure</th>
                  <th class="text-center">Justifié</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let l of lignesEleves; let i = index"
                    [class.table-danger]="l.statut === 'ABSENT'"
                    [class.table-warning]="l.statut === 'RETARD'">
                  <td class="text-muted small">{{ i+1 }}</td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                           style="width:30px;height:30px;font-size:0.7rem;background:#1a6b3c;flex-shrink:0;">
                        {{ (l.prenom[0]+l.nom[0]).toUpperCase() }}
                      </div>
                      <span>{{ l.prenom }} {{ l.nom }}</span>
                    </div>
                  </td>
                  <td><code class="small text-muted">{{ l.matricule }}</code></td>
                  <td class="text-center">
                    <input type="radio" class="form-check-input" [name]="'s'+l.eleveId" value="PRESENT" [(ngModel)]="l.statut">
                  </td>
                  <td class="text-center">
                    <input type="radio" class="form-check-input" [name]="'s'+l.eleveId" value="ABSENT" [(ngModel)]="l.statut">
                  </td>
                  <td class="text-center">
                    <input type="radio" class="form-check-input" [name]="'s'+l.eleveId" value="RETARD" [(ngModel)]="l.statut">
                  </td>
                  <td class="text-center">
                    <input type="radio" class="form-check-input" [name]="'s'+l.eleveId" value="CONGE" [(ngModel)]="l.statut">
                  </td>
                  <td>
                    <input *ngIf="l.statut !== 'PRESENT'" class="form-control form-control-sm"
                           [(ngModel)]="l.motifAbsence" placeholder="Motif..." style="width:130px">
                    <input *ngIf="l.statut === 'RETARD'" type="time" class="form-control form-control-sm ms-1"
                           [(ngModel)]="l.heureArrivee" style="width:100px">
                  </td>
                  <td class="text-center">
                    <input *ngIf="l.statut === 'ABSENT' || l.statut === 'CONGE'" 
                           type="checkbox" class="form-check-input" [(ngModel)]="l.justifie">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div *ngIf="saveMsg" class="alert alert-success m-3 py-2 small">
            <i class="bi bi-check-circle me-1"></i>{{ saveMsg }}
          </div>
        </div>
        <div *ngIf="!selectedClasse" class="text-center text-muted py-5">
          <i class="bi bi-calendar-check fs-1 d-block mb-2"></i>Sélectionnez une classe
        </div>
      </div>

      <!-- TAB ENSEIGNANTS -->
      <div *ngIf="activeTab === 'enseignants'">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="badge bg-success me-1">{{ countEns('PRESENT') }} Présents</span>
                <span class="badge bg-danger me-1">{{ countEns('ABSENT') }} Absents</span>
                <span class="badge bg-warning text-dark">{{ countEns('RETARD') }} Retards</span>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-success btn-sm" (click)="marquerTousEns('PRESENT')">
                  <i class="bi bi-check-all"></i> Tous présents
                </button>
                <button class="btn btn-success btn-sm" (click)="sauvegarderEnseignants()" [disabled]="saving">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!saving" class="bi bi-save me-1"></i>Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card border-0 shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead style="background: #0d6efd; color: white;">
                <tr>
                  <th>Enseignant</th>
                  <th>Classe</th>
                  <th class="text-center">Présent</th>
                  <th class="text-center">Absent</th>
                  <th class="text-center">Retard</th>
                  <th class="text-center">Congé</th>
                  <th>Heure arrivée</th>
                  <th>Heure départ</th>
                  <th>Motif</th>
                  <th class="text-center">Justifié</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let l of lignesEns"
                    [class.table-danger]="l.statut === 'ABSENT'"
                    [class.table-warning]="l.statut === 'RETARD'">
                  <td class="fw-semibold">{{ l.prenom }} {{ l.nom }}</td>
                  <td><span class="badge bg-success">{{ l.classe }}</span></td>
                  <td class="text-center"><input type="radio" class="form-check-input" [name]="'e'+l.enseignantId" value="PRESENT" [(ngModel)]="l.statut"></td>
                  <td class="text-center"><input type="radio" class="form-check-input" [name]="'e'+l.enseignantId" value="ABSENT" [(ngModel)]="l.statut"></td>
                  <td class="text-center"><input type="radio" class="form-check-input" [name]="'e'+l.enseignantId" value="RETARD" [(ngModel)]="l.statut"></td>
                  <td class="text-center"><input type="radio" class="form-check-input" [name]="'e'+l.enseignantId" value="CONGE" [(ngModel)]="l.statut"></td>
                  <td><input type="time" class="form-control form-control-sm" [(ngModel)]="l.heureArrivee" style="width:110px"></td>
                  <td><input type="time" class="form-control form-control-sm" [(ngModel)]="l.heureDepart" style="width:110px"></td>
                  <td><input *ngIf="l.statut !== 'PRESENT'" class="form-control form-control-sm" [(ngModel)]="l.motifAbsence" placeholder="Motif..." style="width:130px"></td>
                  <td class="text-center"><input *ngIf="l.statut !== 'PRESENT'" type="checkbox" class="form-check-input" [(ngModel)]="l.justifie"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div *ngIf="saveMsg" class="alert alert-success m-3 py-2 small">
            <i class="bi bi-check-circle me-1"></i>{{ saveMsg }}
          </div>
        </div>
      </div>

      <!-- TAB RAPPORT -->
      <div *ngIf="activeTab === 'rapport'">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body py-2">
            <div class="row g-2 align-items-center">
              <div class="col-md-2">
                <select class="form-select form-select-sm" [(ngModel)]="rapportType">
                  <option value="eleves">Élèves</option>
                  <option value="enseignants">Enseignants</option>
                </select>
              </div>
              <div class="col-md-2" *ngIf="rapportType === 'eleves'">
                <select class="form-select form-select-sm" [(ngModel)]="rapportClasse">
                  <option value="">— Classe —</option>
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <input type="month" class="form-control form-control-sm" [(ngModel)]="rapportMois">
              </div>
              <div class="col-md-2">
                <button class="btn btn-primary btn-sm w-100" (click)="loadRapport()">
                  <i class="bi bi-search me-1"></i>Afficher
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm" *ngIf="rapportData.length > 0">
          <div class="card-header bg-white border-bottom d-flex justify-content-between py-2">
            <span class="fw-bold">Rapport {{ rapportMois }} — {{ rapportType === 'eleves' ? 'Élèves' : 'Enseignants' }}</span>
            <button class="btn btn-sm btn-outline-success" onclick="window.print()">
              <i class="bi bi-printer me-1"></i>Imprimer
            </button>
          </div>
          <div class="table-responsive">
            <table class="table table-bordered table-sm mb-0">
              <thead style="background:#1a6b3c;color:white;">
                <tr>
                  <th>Nom & Prénom</th>
                  <th *ngIf="rapportType==='eleves'">Matricule</th>
                  <th *ngIf="rapportType==='enseignants'">Classe</th>
                  <th class="text-center">Présences</th>
                  <th class="text-center">Absences</th>
                  <th class="text-center">Retards</th>
                  <th class="text-center">Jours ouvrés</th>
                  <th class="text-center">Taux présence</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of rapportData">
                  <td class="fw-semibold">{{ r.prenom }} {{ r.nom }}</td>
                  <td *ngIf="rapportType==='eleves'"><code class="small">{{ r.matricule }}</code></td>
                  <td *ngIf="rapportType==='enseignants'"><span class="badge bg-success">{{ r.classe }}</span></td>
                  <td class="text-center">
                    <span class="badge bg-success">{{ r.presents }}</span>
                  </td>
                  <td class="text-center">
                    <span class="badge" [class.bg-danger]="r.absents > 0" [class.bg-secondary]="r.absents === 0">
                      {{ r.absents }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge" [class.bg-warning]="r.retards > 0" [class.bg-secondary]="r.retards === 0"
                          [class.text-dark]="r.retards > 0">
                      {{ r.retards }}
                    </span>
                  </td>
                  <td class="text-center">{{ r.total || r.joursOuvres }}</td>
                  <td class="text-center">
                    <div class="d-flex align-items-center gap-1 justify-content-center">
                      <div class="progress flex-grow-1" style="height:6px;width:60px;">
                        <div class="progress-bar"
                             [class.bg-success]="getTaux(r) >= 90"
                             [class.bg-warning]="getTaux(r) >= 75 && getTaux(r) < 90"
                             [class.bg-danger]="getTaux(r) < 75"
                             [style.width.%]="getTaux(r)"></div>
                      </div>
                      <span class="small fw-bold">{{ getTaux(r) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div *ngIf="rapportData.length === 0 && rapportMois" class="text-center text-muted py-4">
          <i class="bi bi-inbox fs-1 d-block mb-2"></i>Aucune donnée pour ce mois
        </div>
      </div>
    </div>
  `
})
export class PointageComponent implements OnInit {
  classes: Classe[] = [];
  selectedClasse = '';
  selectedDate = new Date().toISOString().split('T')[0];
  activeTab = 'eleves';
  lignesEleves: PointageLigne[] = [];
  lignesEns: PointageLigne[] = [];
  saving = false;
  saveMsg = '';
  rapportType = 'eleves';
  rapportClasse = '';
  rapportMois = new Date().toISOString().slice(0, 7);
  rapportData: RapportPointage[] = [];
  anneeScol = '2023-2024';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getClasses().subscribe(c => this.classes = c);
  }

  onDateChange() {
    if (this.selectedClasse) this.loadPointageEleves();
    if (this.activeTab === 'enseignants') this.loadEnseignants();
  }

  loadPointageEleves() {
    if (!this.selectedClasse) return;
    this.api.getPointageClasse(+this.selectedClasse, this.selectedDate).subscribe(l => this.lignesEleves = l);
  }

  loadEnseignants() {
    this.api.getPointageEnseignants(this.selectedDate).subscribe(l => this.lignesEns = l);
  }

  marquerTous(statut: string) {
    this.lignesEleves.forEach(l => l.statut = statut as any);
  }

  marquerTousEns(statut: string) {
    this.lignesEns.forEach(l => l.statut = statut as any);
  }

  sauvegarderEleves() {
    if (!this.selectedClasse) return;
    this.saving = true;
    this.api.savePointageBatch({
      classeId: +this.selectedClasse,
      date: this.selectedDate,
      anneeScol: this.anneeScol,
      pointages: this.lignesEleves.map(l => ({
        eleveId: l.eleveId,
        statut: l.statut,
        motifAbsence: l.motifAbsence,
        justifie: l.justifie,
        heureArrivee: l.heureArrivee
      }))
    }).subscribe({
      next: (res) => {
        this.saving = false;
        this.saveMsg = `${res.saved} pointage(s) enregistré(s) pour le ${this.selectedDate}`;
        setTimeout(() => this.saveMsg = '', 4000);
      },
      error: () => this.saving = false
    });
  }

  sauvegarderEnseignants() {
    this.saving = true;
    this.api.savePointageEnseignants({
      date: this.selectedDate,
      anneeScol: this.anneeScol,
      pointages: this.lignesEns.map(l => ({
        enseignantId: l.enseignantId,
        statut: l.statut,
        motifAbsence: l.motifAbsence,
        justifie: l.justifie,
        heureArrivee: l.heureArrivee,
        heureDepart: l.heureDepart
      }))
    }).subscribe({
      next: (res) => {
        this.saving = false;
        this.saveMsg = `${res.saved} pointage(s) enregistré(s)`;
        setTimeout(() => this.saveMsg = '', 4000);
      },
      error: () => this.saving = false
    });
  }

  loadRapport() {
    if (this.rapportType === 'eleves' && this.rapportClasse) {
      this.api.getRapportMensuelClasse(+this.rapportClasse, this.rapportMois)
          .subscribe(d => this.rapportData = d);
    } else if (this.rapportType === 'enseignants') {
      this.api.getRapportMensuelEnseignants(this.rapportMois)
          .subscribe(d => this.rapportData = d);
    }
  }

  // fix for loadRapport method
  get rapportType_() { return this.rapportType; }

  countStatut(s: string) { return this.lignesEleves.filter(l => l.statut === s).length; }
  countEns(s: string) { return this.lignesEns.filter(l => l.statut === s).length; }
  getTaux(r: RapportPointage): number {
    const total = (r.total || r.joursOuvres || 0);
    if (!total) return 100;
    return Math.round((r.presents / total) * 100);
  }
}
