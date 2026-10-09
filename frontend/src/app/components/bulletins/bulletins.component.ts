import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Bulletin, Classe, Matiere, Note } from '../../models/models';

@Component({
  selector: 'app-bulletins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Bulletins de Notes</h3>
          <p class="text-muted mb-0">Génération et impression des bulletins scolaires</p>
        </div>
      </div>

      <!-- Filters / Generate -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small fw-semibold">Classe</label>
              <select class="form-select" [(ngModel)]="selectedClasse" (change)="loadBulletins()">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label small fw-semibold">Semestre</label>
              <select class="form-select" [(ngModel)]="semestre" (change)="loadBulletins()">
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
                <option value="T1">Trimestre 1</option>
                <option value="T2">Trimestre 2</option>
                <option value="T3">Trimestre 3</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label small fw-semibold">Année</label>
              <input class="form-control" [(ngModel)]="anneeScol">
            </div>
            <div class="col-md-2">
              <button class="btn btn-success w-100" (click)="generate()" [disabled]="!selectedClasse || generating">
                <span *ngIf="generating" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!generating" class="bi bi-magic me-1"></i>
                Générer
              </button>
            </div>
            <div class="col-md-3">
              <div *ngIf="genResult" class="alert alert-success py-2 mb-0 small">
                <i class="bi bi-check-circle me-1"></i>{{ genResult }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulletins list -->
      <div class="row g-3" *ngIf="bulletins.length > 0">
        <div class="col-md-4" *ngFor="let b of bulletins">
          <div class="card border-0 shadow-sm h-100 cursor-pointer" 
               style="cursor: pointer; transition: transform 0.2s;"
     (mouseenter)="hover = true"
     (mouseleave)="hover = false"
     [style.transform]="hover ? 'translateY(-2px)' : 'translateY(0)'"
     style="transition: transform 0.2s ease;">
            <div class="card-header py-2" style="background: #1a6b3c; color: white;">
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold small">{{ b.eleve?.prenom }} {{ b.eleve?.nom }}</span>
                <span class="badge bg-light text-success">{{ b.eleve?.classe?.nom }}</span>
              </div>
            </div>
            <div class="card-body py-3">
              <div class="row g-2 mb-3">
                <div class="col-4 text-center">
                  <div class="fw-bold fs-4" 
                       [class.text-success]="(b.moyenne||0) >= 14"
                       [class.text-warning]="(b.moyenne||0) >= 10 && (b.moyenne||0) < 14"
                       [class.text-danger]="(b.moyenne||0) < 10">
                    {{ b.moyenne | number:'1.2-2' }}
                  </div>
                  <div class="text-muted small">Moyenne</div>
                </div>
                <div class="col-4 text-center">
                  <div class="fw-bold fs-4">{{ b.rang }}<sup class="small">e</sup></div>
                  <div class="text-muted small">Rang</div>
                </div>
                <div class="col-4 text-center">
                  <div class="fw-bold fs-4 text-secondary">{{ b.moyenneClasse | number:'1.2-2' }}</div>
                  <div class="text-muted small">Moy. classe</div>
                </div>
              </div>
              <div class="text-center">
                <span class="badge fs-6 px-3" [style.background]="getApprecBg(b.appreciation || '')">
                  {{ b.appreciation }}
                </span>
              </div>
              <div class="d-flex justify-content-between mt-2 small text-muted">
                <span>
                  <i class="bi bi-pen me-1" [class.text-success]="b.signeEnseignant" [class.text-muted]="!b.signeEnseignant"></i>Maître
                  <i class="bi bi-pen ms-2 me-1" [class.text-success]="b.signeDirecteur" [class.text-muted]="!b.signeDirecteur"></i>Dir.
                  <i class="bi bi-pen ms-2 me-1" [class.text-success]="b.signeParent" [class.text-muted]="!b.signeParent"></i>Parent
                </span>
              </div>
            </div>
            <div class="card-footer bg-white py-2">
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-success flex-grow-1" (click)="viewBulletin(b)">
                  <i class="bi bi-eye me-1"></i>Voir
                </button>
                <button class="btn btn-sm btn-outline-primary" (click)="printBulletin(b)">
                  <i class="bi bi-printer"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!selectedClasse" class="text-center text-muted py-5">
        <i class="bi bi-file-earmark-text fs-1 d-block mb-2"></i>
        Sélectionnez une classe et générez les bulletins
      </div>
      <div *ngIf="selectedClasse && bulletins.length === 0" class="text-center text-muted py-5">
        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
        Aucun bulletin trouvé. Cliquez sur "Générer" pour créer les bulletins.
      </div>
    </div>

    <!-- Bulletin Detail Modal (print-ready) -->
    <div class="modal fade show d-block" *ngIf="selectedBulletin" style="background: rgba(0,0,0,0.7);">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header no-print">
            <h5 class="modal-title">Bulletin — {{ selectedBulletin.bulletin?.eleve?.prenom }} {{ selectedBulletin.bulletin?.eleve?.nom }}</h5>
            <div class="d-flex gap-2">
              <button class="btn btn-success btn-sm" onclick="window.print()">
                <i class="bi bi-printer me-1"></i>Imprimer
              </button>
              <button class="btn-close" (click)="selectedBulletin = null"></button>
            </div>
          </div>
          <div class="modal-body p-0">
            <div id="bulletin-print" class="p-4">
              <!-- Bulletin Header -->
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div class="fw-bold">MINISTERE DE L'EDUCATION NATIONALE</div>
                  <div class="small">IEF / IA DE DIOURBEL</div>
                </div>
                <div class="text-center">
                  <div class="border border-2 border-dark px-3 py-1 fw-bold">
                    INSTITUT ANNOUR<br>
                    <span class="small fw-normal">ANNEE : {{ anneeScol }}</span>
                  </div>
                </div>
              </div>
              <div class="border-bottom border-2 mb-3 pb-2">
                <div class="d-flex gap-4 mb-1">
                  <span><strong>Prénom :</strong> {{ selectedBulletin.bulletin?.eleve?.prenom }}</span>
                  <span><strong>Nom :</strong> {{ selectedBulletin.bulletin?.eleve?.nom }}</span>
                  <span class="ms-auto"><strong>COUR : {{ selectedBulletin.bulletin?.eleve?.classe?.nom }}</strong></span>
                </div>
                <div class="d-flex gap-4">
                  <span><strong>Né(e) le :</strong> {{ selectedBulletin.bulletin?.eleve?.dateNaissance | date:'dd/MM/yyyy' }}</span>
                  <span>à {{ selectedBulletin.bulletin?.eleve?.lieuNaissance }}</span>
                  <span class="ms-auto"><strong>EFFECTIFS : {{ selectedBulletin.bulletin?.eleve?.classe?.effectifs }}</strong></span>
                </div>
              </div>
              <h5 class="text-center fw-bold text-decoration-underline mb-4">
                Bulletin de Notes : Évaluation du {{ semestre.startsWith('S') ? 'Premier' : 'Premier' }} Semestre
              </h5>

              <!-- Notes table -->
              <table class="table table-bordered mb-4">
                <thead>
                  <tr style="background: #f0f0f0;">
                    <th style="width: 25%;">Disciplines</th>
                    <th class="text-center">Ressources</th>
                    <th class="text-center">Compétences</th>
                    <th class="text-center">Total</th>
                    <th class="text-center">Sur</th>
                    <th>Appréciations</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let n of selectedBulletin.notes">
                    <td class="fw-semibold">{{ n.matiere?.nom }}</td>
                    <td class="text-center">{{ n.noteRessources }}</td>
                    <td class="text-center">{{ n.noteCompetences }}</td>
                    <td class="text-center fw-bold">{{ n.total }}</td>
                    <td class="text-center fw-bold">{{ n.matiere?.noteMax }}</td>
                    <td>{{ n.appreciation }}</td>
                  </tr>
                  <tr>
                    <td colspan="2"></td>
                    <td class="fw-bold text-end">Total :</td>
                    <td class="text-center fw-bold">{{ getTotalPoints() }}</td>
                    <td class="text-center fw-bold">{{ getTotalMax() }}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colspan="3" class="fw-bold text-end">Moyenne :</td>
                    <td colspan="2" class="text-center fw-bold fs-5">{{ selectedBulletin.bulletin?.moyenne | number:'1.2-2' }}/20</td>
                    <td>
                      <span class="badge" [style.background]="getApprecBg(selectedBulletin.bulletin?.appreciation || '')">
                        {{ selectedBulletin.bulletin?.appreciation }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="3" class="fw-bold text-end">Rang :</td>
                    <td colspan="3" class="fw-bold">
                      {{ selectedBulletin.bulletin?.rang }}e sur {{ selectedBulletin.bulletin?.eleve?.classe?.effectifs }}
                      &nbsp;&nbsp;&nbsp; Moy. classe : {{ selectedBulletin.bulletin?.moyenneClasse | number:'1.2-2' }}/20
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Signatures -->
              <div class="d-flex justify-content-between mt-5 pt-3">
                <div class="text-center">
                  <div class="fw-bold text-decoration-underline mb-4">L'ENSEIGNANT</div>
                  <div class="border-bottom border-dark" style="width: 120px; margin: auto;"></div>
                </div>
                <div class="text-center">
                  <div class="fw-bold text-decoration-underline mb-4">LE DIRECTEUR</div>
                  <div class="border-bottom border-dark" style="width: 120px; margin: auto;"></div>
                </div>
                <div class="text-center">
                  <div class="fw-bold text-decoration-underline mb-4">LE PARENT</div>
                  <div class="border-bottom border-dark" style="width: 120px; margin: auto;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      @media print {
        .no-print { display: none !important; }
        .modal-dialog { max-width: 100% !important; margin: 0 !important; }
        .modal-content { border: none !important; box-shadow: none !important; }
      }
    </style>
  `
})
export class BulletinsComponent implements OnInit {
  classes: Classe[] = [];
  bulletins: Bulletin[] = [];
  selectedClasse = '';
  semestre = 'S1';
  anneeScol = '2023-2024';
  generating = false;
  genResult = '';
  selectedBulletin: any = null;
  hover = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getClasses().subscribe(c => this.classes = c);
  }

  loadBulletins() {
    if (!this.selectedClasse) return;
    this.api.getBulletins({
      classeId: this.selectedClasse,
      semestre: this.semestre,
      anneeScol: this.anneeScol
    }).subscribe(b => this.bulletins = b);
  }

  generate() {
    if (!this.selectedClasse) return;
    this.generating = true;
    this.api.generateBulletins(+this.selectedClasse, this.semestre, this.anneeScol).subscribe({
      next: (res) => {
        this.genResult = `${res.generated} bulletin(s) généré(s). Moy. classe: ${res.moyenneClasse}/20`;
        this.generating = false;
        this.loadBulletins();
        setTimeout(() => this.genResult = '', 5000);
      },
      error: () => this.generating = false
    });
  }

  viewBulletin(b: Bulletin) {
    this.api.getBulletinDetails(b.id!).subscribe(details => {
      this.selectedBulletin = details;
    });
  }

  printBulletin(b: Bulletin) {
    this.api.getBulletinDetails(b.id!).subscribe(details => {
      this.selectedBulletin = details;
      setTimeout(() => window.print(), 500);
    });
  }

  getTotalPoints(): number {
    if (!this.selectedBulletin?.notes) return 0;
    return this.selectedBulletin.notes.reduce((s: number, n: Note) => s + (n.total || 0), 0);
  }

  getTotalMax(): number {
    if (!this.selectedBulletin?.notes) return 0;
    return this.selectedBulletin.notes.reduce((s: number, n: Note) => s + (n.matiere?.noteMax || 0), 0);
  }

  getApprecBg(apprec: string): string {
    if (apprec?.includes('Excellent')) return '#1a6b3c';
    if (apprec?.includes('Félicitation') || apprec?.includes('Très')) return '#0d6efd';
    if (apprec?.includes('Tableau') || apprec?.includes('Bien')) return '#17a2b8';
    if (apprec?.includes('Encour') || apprec?.includes('Assez')) return '#fd7e14';
    if (apprec?.includes('Passable')) return '#6c757d';
    return '#dc3545';
  }
}
