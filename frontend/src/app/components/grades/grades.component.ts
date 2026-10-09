import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Eleve, Classe, Matiere, Note } from '../../models/models';

interface NoteRow {
  eleve: Eleve;
  notes: { [matiereId: number]: { ressources: number | null, competences: number | null, total?: number } };
}

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Saisie des Notes</h3>
          <p class="text-muted mb-0">Enregistrement des évaluations par semestre</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success" (click)="showImport = true">
            <i class="bi bi-cloud-upload me-1"></i>Import Excel
          </button>
          <button class="btn btn-success" (click)="saveAll()" [disabled]="saving">
            <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!saving" class="bi bi-save me-1"></i>Enregistrer tout
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label small fw-semibold">Classe</label>
              <select class="form-select" [(ngModel)]="selectedClasse" (change)="loadData()">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-semibold">Semestre</label>
              <select class="form-select" [(ngModel)]="semestre" (change)="loadData()">
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
                <option value="T1">Trimestre 1</option>
                <option value="T2">Trimestre 2</option>
                <option value="T3">Trimestre 3</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-semibold">Année scolaire</label>
              <input class="form-control" [(ngModel)]="anneeScol" (change)="loadData()">
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <div *ngIf="savedMessage" class="alert alert-success py-2 px-3 mb-0 small w-100">
                <i class="bi bi-check-circle me-1"></i>{{ savedMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes grid -->
      <div class="card border-0 shadow-sm" *ngIf="selectedClasse && rows.length > 0">
        <div class="card-header bg-white py-3">
          <h6 class="mb-0">
            Grille de notes — Classe {{ getClassName() }} — {{ semestre }} {{ anneeScol }}
          </h6>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered table-sm mb-0">
            <thead>
              <tr style="background: #1a6b3c; color: white;">
                <th rowspan="2" class="align-middle" style="min-width: 160px;">Élève</th>
                <th *ngFor="let m of matieres" [attr.colspan]="3" class="text-center"
                    style="font-size: 0.75rem;">
                  {{ m.nom }}<br><small class="opacity-75">/{{ m.noteMax }}</small>
                </th>
                <th rowspan="2" class="align-middle text-center">Moy.<br>/20</th>
              </tr>
              <tr style="background: #2d9e5f; color: white;">
                <ng-container *ngFor="let m of matieres">
                  <th class="text-center" style="font-size: 0.7rem; width: 55px;">Ress.</th>
                  <th class="text-center" style="font-size: 0.7rem; width: 55px;">Comp.</th>
                  <th class="text-center" style="font-size: 0.7rem; width: 50px;">Total</th>
                </ng-container>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of rows">
                <td class="fw-semibold">{{ row.eleve.prenom }} {{ row.eleve.nom }}</td>
                <ng-container *ngFor="let m of matieres">
                  <td class="p-1">
                    <input type="number" class="form-control form-control-sm text-center p-1"
                           [max]="m.noteMax" min="0" style="width: 52px; font-size: 0.8rem;"
                           [(ngModel)]="row.notes[m.id!].ressources"
                           (change)="computeTotal(row, m)">
                  </td>
                  <td class="p-1">
                    <input type="number" class="form-control form-control-sm text-center p-1"
                           [max]="m.noteMax" min="0" style="width: 52px; font-size: 0.8rem;"
                           [(ngModel)]="row.notes[m.id!].competences"
                           (change)="computeTotal(row, m)">
                  </td>
                  <td class="text-center align-middle">
                    <span class="fw-bold" [class.text-danger]="(row.notes[m.id!].total || 0) < m.noteMax * 0.5"
                          [class.text-success]="(row.notes[m.id!].total || 0) >= m.noteMax * 0.75">
                      {{ row.notes[m.id!].total ?? '' }}
                    </span>
                  </td>
                </ng-container>
                <td class="text-center align-middle fw-bold" 
                    [class.text-danger]="computeMoyenne(row) < 10"
                    [class.text-success]="computeMoyenne(row) >= 14">
                  {{ computeMoyenne(row) | number:'1.2-2' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="!selectedClasse" class="text-center text-muted py-5">
        <i class="bi bi-arrow-up-circle fs-1 d-block mb-2"></i>
        Sélectionnez une classe pour commencer la saisie
      </div>

      <div *ngIf="selectedClasse && rows.length === 0" class="text-center text-muted py-5">
        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
        Aucun élève dans cette classe
      </div>
    </div>

    <!-- Import Modal -->
    <div class="modal fade show d-block" *ngIf="showImport" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header" style="background: #1a6b3c; color: white;">
            <h5 class="modal-title"><i class="bi bi-cloud-upload me-2"></i>Importer des notes</h5>
            <button class="btn-close btn-close-white" (click)="showImport = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info small">
              <strong>Format :</strong> Col A=Matricule, B=Prénom, C=Nom, puis pour chaque matière: 
              Ressources et Compétences en colonnes paires. La 1ère ligne est un en-tête ignoré.
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Fichier Excel (.xlsx)</label>
              <input type="file" class="form-control" accept=".xlsx,.xls" (change)="onImportFile($event)">
            </div>
            <div *ngIf="importResult" class="alert"
                 [class.alert-success]="!importResult.errors?.length"
                 [class.alert-warning]="importResult.errors?.length">
              <strong>{{ importResult.saved }} note(s) importée(s)</strong>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showImport = false">Fermer</button>
            <button class="btn btn-success" (click)="importNotes()" [disabled]="!importFile || !selectedClasse || saving">
              Importer
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GradesComponent implements OnInit {
  classes: Classe[] = [];
  matieres: Matiere[] = [];
  rows: NoteRow[] = [];
  selectedClasse = '';
  semestre = 'S1';
  anneeScol = '2023-2024';
  saving = false;
  savedMessage = '';
  showImport = false;
  importFile: File | null = null;
  importResult: any = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getClasses().subscribe(c => this.classes = c);
    this.api.getMatieres().subscribe(m => this.matieres = m);
  }

  loadData() {
    if (!this.selectedClasse) return;
    const classeId = +this.selectedClasse;
    this.api.getEleves(classeId).subscribe(eleves => {
      this.api.getNotesByClasse(classeId, this.semestre, this.anneeScol).subscribe(notes => {
        this.rows = eleves.map(e => {
          const row: NoteRow = { eleve: e, notes: {} };
          this.matieres.forEach(m => {
            const note = notes.find(n => n.eleve?.id === e.id && n.matiere?.id === m.id);
            row.notes[m.id!] = {
              ressources: note?.noteRessources ?? null,
              competences: note?.noteCompetences ?? null,
              total: note?.total
            };
          });
          return row;
        });
      });
    });
  }

  computeTotal(row: NoteRow, m: Matiere) {
    const n = row.notes[m.id!];
    if (n.ressources != null && n.competences != null) {
      n.total = +n.ressources + +n.competences;
    }
  }

  computeMoyenne(row: NoteRow): number {
    const totalMax = this.matieres.reduce((s, m) => s + m.noteMax, 0);
    const total = this.matieres.reduce((s, m) => s + (row.notes[m.id!]?.total || 0), 0);
    return totalMax ? Math.round((total * 20 / totalMax) * 100) / 100 : 0;
  }

  saveAll() {
    if (!this.selectedClasse) return;
    this.saving = true;
    const batch: any[] = [];
    this.rows.forEach(row => {
      this.matieres.forEach(m => {
        const n = row.notes[m.id!];
        if (n.ressources != null || n.competences != null) {
          batch.push({
            eleveId: row.eleve.id,
            matiereId: m.id,
            noteRessources: n.ressources,
            noteCompetences: n.competences,
            semestre: this.semestre,
            anneeScol: this.anneeScol
          });
        }
      });
    });
    this.api.saveBatchNotes(batch).subscribe({
      next: () => {
        this.saving = false;
        this.savedMessage = `${batch.length} note(s) enregistrée(s)`;
        setTimeout(() => this.savedMessage = '', 3000);
        this.loadData();
      },
      error: () => this.saving = false
    });
  }

  getClassName(): string {
    return this.classes.find(c => c.id === +this.selectedClasse)?.nom || '';
  }

  onImportFile(event: any) {
    this.importFile = event.target.files[0];
  }

  importNotes() {
    if (!this.importFile || !this.selectedClasse) return;
    this.saving = true;
    this.api.importNotes(this.importFile, +this.selectedClasse, this.semestre, this.anneeScol).subscribe({
      next: (res) => { this.importResult = res; this.saving = false; this.loadData(); },
      error: () => this.saving = false
    });
  }
}
