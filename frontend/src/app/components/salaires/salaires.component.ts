import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SalaireProfesseur, ConfigurationSalaire, User } from '../../models/models';

@Component({
  selector: 'app-salaires',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Gestion de la Paie</h3>
          <p class="text-muted mb-0">Fiches de salaire & bulletins de paie des enseignants</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary" (click)="activeTab='configs'">
            <i class="bi bi-sliders me-1"></i>Grille salariale
          </button>
          <button class="btn btn-success" (click)="showGenererModal = true">
            <i class="bi bi-magic me-1"></i>Générer fiches de paie
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab==='fiches'" (click)="activeTab='fiches'" href="javascript:void(0)">
            <i class="bi bi-file-earmark-text me-1"></i>Fiches de paie
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab==='configs'" (click)="activeTab='configs'; loadConfigs()" href="javascript:void(0)">
            <i class="bi bi-sliders me-1"></i>Grille salariale
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab==='stats'" (click)="activeTab='stats'; loadStats()" href="javascript:void(0)">
            <i class="bi bi-graph-up me-1"></i>Statistiques
          </a>
        </li>
      </ul>

      <!-- TAB FICHES -->
      <div *ngIf="activeTab==='fiches'">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body py-2">
            <div class="row g-2 align-items-center">
              <div class="col-md-2">
                <input type="month" class="form-control form-control-sm" [(ngModel)]="filterMois" (change)="loadSalaires()">
              </div>
              <div class="col-md-2">
                <select class="form-select form-select-sm" [(ngModel)]="filterStatut" (change)="loadSalaires()">
                  <option value="">Tous statuts</option>
                  <option value="PAYE">Payé</option>
                  <option value="IMPAYE">Impayé</option>
                </select>
              </div>
              <div class="col-auto">
                <span class="badge bg-secondary">{{ salaires.length }} fiche(s)</span>
                <span *ngIf="totalMasse > 0" class="badge bg-success ms-2">
                  Total : {{ totalMasse | number:'1.0-0' }} FCFA
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-3">
          <div class="col-md-6 col-lg-4" *ngFor="let s of salaires">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header py-2 d-flex justify-content-between align-items-center"
                   style="background:#1a6b3c;color:white;">
                <span class="fw-bold">{{ s.enseignant?.prenom }} {{ s.enseignant?.nom }}</span>
                <span class="badge" [class.bg-success]="s.statut==='PAYE'" [class.bg-warning]="s.statut!=='PAYE'"
                      [class.text-dark]="s.statut!=='PAYE'">{{ s.statut }}</span>
              </div>
              <div class="card-body py-2">
                <div class="d-flex justify-content-between mb-1 small">
                  <span class="text-muted">Salaire brut</span>
                  <span class="fw-semibold">{{ s.salaireBrut | number:'1.0-0' }} F</span>
                </div>
                <div class="d-flex justify-content-between mb-1 small">
                  <span class="text-muted">IPRES</span>
                  <span class="text-danger">- {{ s.cotisationIPRES | number:'1.0-0' }} F</span>
                </div>
                <div class="d-flex justify-content-between mb-1 small">
                  <span class="text-muted">CSS</span>
                  <span class="text-danger">- {{ s.cotisationCSS | number:'1.0-0' }} F</span>
                </div>
                <div class="d-flex justify-content-between mb-1 small">
                  <span class="text-muted">IRPP</span>
                  <span class="text-danger">- {{ s.impotSurRevenu | number:'1.0-0' }} F</span>
                </div>
                <div *ngIf="(s.joursAbsenceNonJustifie || 0) > 0" class="d-flex justify-content-between mb-1 small">
                  <span class="text-muted">Abs. non justif. ({{ s.joursAbsenceNonJustifie }}j)</span>
                  <span class="text-danger">- {{ s.deductionAbsences | number:'1.0-0' }} F</span>
                </div>
                <hr class="my-2">
                <div class="d-flex justify-content-between fw-bold">
                  <span>NET À PAYER</span>
                  <span class="text-success fs-5">{{ s.salaireNet | number:'1.0-0' }} <small class="fs-6">FCFA</small></span>
                </div>
                <div *ngIf="s.datePaiement" class="small text-muted mt-1">
                  Payé le {{ s.datePaiement | date:'dd/MM/yyyy' }} — {{ s.modePaiement }}
                </div>
              </div>
              <div class="card-footer bg-white py-2 d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary flex-grow-1" (click)="voirBulletin(s)">
                  <i class="bi bi-file-earmark-text me-1"></i>Bulletin
                </button>
                <button *ngIf="s.statut !== 'PAYE'" class="btn btn-sm btn-success flex-grow-1" (click)="openPayerModal(s)">
                  <i class="bi bi-cash me-1"></i>Payer
                </button>
                <button *ngIf="!s.valide" class="btn btn-sm btn-outline-warning" (click)="valider(s)" title="Valider">
                  <i class="bi bi-check2"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="col-12 text-center text-muted py-5" *ngIf="salaires.length === 0">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            Aucune fiche pour ce mois. Cliquez sur "Générer fiches de paie".
          </div>
        </div>
      </div>

      <!-- TAB CONFIGS -->
      <div *ngIf="activeTab==='configs'">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between">
            <h6 class="mb-0 fw-bold">Grille salariale des enseignants</h6>
            <button class="btn btn-sm btn-success" (click)="openConfigModal()">
              <i class="bi bi-plus me-1"></i>Configurer
            </button>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead style="background:#f8f9fa;">
                <tr>
                  <th>Enseignant</th>
                  <th class="text-end">Salaire base</th>
                  <th class="text-end">Prime anc.</th>
                  <th class="text-end">Transport</th>
                  <th class="text-end">Logement</th>
                  <th class="text-end">Salaire brut</th>
                  <th>Qualification</th>
                  <th>Ancienneté</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of configs">
                  <td class="fw-semibold">{{ c.enseignant?.prenom }} {{ c.enseignant?.nom }}</td>
                  <td class="text-end">{{ c.salaireBase | number:'1.0-0' }}</td>
                  <td class="text-end">{{ c.primeAnciennete | number:'1.0-0' }}</td>
                  <td class="text-end">{{ c.indemnitesTransport | number:'1.0-0' }}</td>
                  <td class="text-end">{{ c.indemnitesLogement | number:'1.0-0' }}</td>
                  <td class="text-end fw-bold text-success">
                    {{ ((c.salaireBase||0)+(c.primeAnciennete||0)+(c.indemnitesTransport||0)+(c.indemnitesLogement||0)) | number:'1.0-0' }}
                  </td>
                  <td><span class="badge bg-info text-dark">{{ c.niveauQualification }}</span></td>
                  <td>{{ c.anneesAnciennete }} an(s)</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary" (click)="openConfigModal(c)">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB STATS -->
      <div *ngIf="activeTab==='stats'">
        <div class="row g-3" *ngIf="statsData">
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center py-4" style="border-top:4px solid #1a6b3c !important;">
              <div class="fs-1 fw-bold text-success">{{ statsData.totalMasseSalarialeAnnee | number:'1.0-0' }}</div>
              <div class="text-muted">Masse salariale annuelle (FCFA)</div>
            </div>
          </div>
          <div class="col-md-4" *ngIf="statsData.totalMasseSalarialeMois">
            <div class="card border-0 shadow-sm text-center py-4" style="border-top:4px solid #0d6efd !important;">
              <div class="fs-1 fw-bold text-primary">{{ statsData.totalMasseSalarialeMois | number:'1.0-0' }}</div>
              <div class="text-muted">Masse salariale du mois (FCFA)</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center py-4" style="border-top:4px solid #dc3545 !important;">
              <div class="fs-1 fw-bold text-danger">{{ statsData.nbImpayes }}</div>
              <div class="text-muted">Salaires non payés</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Générer Modal -->
    <div class="modal fade show d-block" *ngIf="showGenererModal" style="background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header" style="background:#1a6b3c;color:white;">
            <h5 class="modal-title"><i class="bi bi-magic me-2"></i>Générer les fiches de paie</h5>
            <button class="btn-close btn-close-white" (click)="showGenererModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-semibold">Mois</label>
              <input type="month" class="form-control" [(ngModel)]="genForm.mois">
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Jours ouvrés dans le mois</label>
              <input type="number" class="form-control" [(ngModel)]="genForm.joursOuvres">
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Année scolaire</label>
              <input class="form-control" [(ngModel)]="genForm.anneeScol">
            </div>
            <div *ngIf="genResult" class="alert alert-success small">
              <strong>{{ genResult.generated }} fiche(s) générée(s)</strong><br>
              Masse salariale : {{ genResult.totalMasseSalariale | number:'1.0-0' }} FCFA
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showGenererModal = false">Fermer</button>
            <button class="btn btn-success" (click)="genererFiches()" [disabled]="saving">
              <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
              Générer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payer Modal -->
    <div class="modal fade show d-block" *ngIf="payerModal" style="background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header" style="background:#1a6b3c;color:white;">
            <h5 class="modal-title"><i class="bi bi-cash me-2"></i>Enregistrer le paiement</h5>
            <button class="btn-close btn-close-white" (click)="payerModal = null"></button>
          </div>
          <div class="modal-body">
            <p>Salaire net de <strong>{{ payerModal.enseignant?.prenom }} {{ payerModal.enseignant?.nom }}</strong></p>
            <div class="alert alert-info">Montant : <strong>{{ payerModal.salaireNet | number:'1.0-0' }} FCFA</strong></div>
            <div class="mb-3">
              <label class="form-label">Mode de paiement</label>
              <select class="form-select" [(ngModel)]="payerForm.modePaiement">
                <option value="VIREMENT">Virement bancaire</option>
                <option value="ESPECES">Espèces</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Référence virement</label>
              <input class="form-control" [(ngModel)]="payerForm.referenceVirement" placeholder="REF-...">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="payerModal = null">Annuler</button>
            <button class="btn btn-success" (click)="payerSalaire()" [disabled]="saving">Confirmer paiement</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Config Modal -->
    <div class="modal fade show d-block" *ngIf="configModal" style="background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header" style="background:#1a6b3c;color:white;">
            <h5 class="modal-title">Configurer le salaire</h5>
            <button class="btn-close btn-close-white" (click)="configModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12" *ngIf="!editConfig?.id">
                <label class="form-label fw-semibold">Enseignant</label>
                <select class="form-select" [(ngModel)]="configForm.enseignantId">
                  <option *ngFor="let e of enseignants" [value]="e.id">{{ e.prenom }} {{ e.nom }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Salaire de base (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="configForm.salaireBase">
              </div>
              <div class="col-md-6">
                <label class="form-label">Prime ancienneté (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="configForm.primeAnciennete">
              </div>
              <div class="col-md-6">
                <label class="form-label">Indemnité transport (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="configForm.indemnitesTransport">
              </div>
              <div class="col-md-6">
                <label class="form-label">Indemnité logement (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="configForm.indemnitesLogement">
              </div>
              <div class="col-md-6">
                <label class="form-label">Ancienneté (années)</label>
                <input type="number" class="form-control" [(ngModel)]="configForm.anneesAnciennete">
              </div>
              <div class="col-md-6">
                <label class="form-label">Niveau qualification</label>
                <select class="form-select" [(ngModel)]="configForm.niveauQualification">
                  <option value="BEPC">BEPC</option>
                  <option value="BAC">Baccalauréat</option>
                  <option value="LICENCE">Licence</option>
                  <option value="MASTER">Master</option>
                </select>
              </div>
              <div class="col-12">
                <div class="alert alert-info small">
                  Salaire brut estimé : <strong>{{ estimateBrut() | number:'1.0-0' }} FCFA</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="configModal = false">Annuler</button>
            <button class="btn btn-success" (click)="saveConfig()" [disabled]="saving">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- BULLETIN DE PAIE imprimable -->
    <div class="modal fade show d-block" *ngIf="bulletinPaie" style="background:rgba(0,0,0,0.7)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header no-print">
            <h5 class="modal-title">Bulletin de paie — {{ bulletinPaie.mois }}</h5>
            <div class="d-flex gap-2">
              <button class="btn btn-success btn-sm" onclick="window.print()">
                <i class="bi bi-printer me-1"></i>Imprimer
              </button>
              <button class="btn-close" (click)="bulletinPaie = null"></button>
            </div>
          </div>
          <div class="modal-body p-4" id="bulletin-paie-print">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-start mb-4">
              <div>
                <div class="fw-bold fs-5">INSTITUT ANNOUR</div>
                <div class="small text-muted">IEF/IA de Diourbel</div>
                <div class="small text-muted">Année scolaire : {{ bulletinPaie.anneeScol }}</div>
              </div>
              <div class="text-center border border-2 px-3 py-2">
                <div class="fw-bold text-decoration-underline">BULLETIN DE PAIE</div>
                <div class="small">Mois de {{ formatMois(bulletinPaie.mois) }}</div>
              </div>
            </div>
            <!-- Info enseignant -->
            <div class="row g-2 small mb-4 border rounded p-2 bg-light">
              <div class="col-6"><strong>Nom & Prénom :</strong> {{ bulletinPaie.enseignant?.prenom }} {{ bulletinPaie.enseignant?.nom }}</div>
              <div class="col-6"><strong>Qualification :</strong> —</div>
              <div class="col-6"><strong>Poste :</strong> Enseignant</div>
              <div class="col-6"><strong>Mois :</strong> {{ formatMois(bulletinPaie.mois) }}</div>
            </div>
            <!-- Tableau rémunérations -->
            <div class="row">
              <div class="col-7">
                <table class="table table-bordered table-sm mb-3">
                  <thead class="table-dark">
                    <tr><th colspan="2">ÉLÉMENTS DE RÉMUNÉRATION</th></tr>
                    <tr><th>Désignation</th><th class="text-end">Montant</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Salaire de base</td><td class="text-end">{{ bulletinPaie.salaireBase | number:'1.0-0' }}</td></tr>
                    <tr *ngIf="bulletinPaie.primeAnciennete"><td>Prime d'ancienneté</td><td class="text-end">{{ bulletinPaie.primeAnciennete | number:'1.0-0' }}</td></tr>
                    <tr *ngIf="bulletinPaie.indemnitesTransport"><td>Indemnité transport</td><td class="text-end">{{ bulletinPaie.indemnitesTransport | number:'1.0-0' }}</td></tr>
                    <tr *ngIf="bulletinPaie.indemnitesLogement"><td>Indemnité logement</td><td class="text-end">{{ bulletinPaie.indemnitesLogement | number:'1.0-0' }}</td></tr>
                    <tr class="table-light fw-bold"><td>SALAIRE BRUT</td><td class="text-end">{{ bulletinPaie.salaireBrut | number:'1.0-0' }}</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="col-5">
                <table class="table table-bordered table-sm mb-3">
                  <thead class="table-dark">
                    <tr><th colspan="2">RETENUES</th></tr>
                    <tr><th>Désignation</th><th class="text-end">Montant</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>IPRES (8.4%)</td><td class="text-end text-danger">{{ bulletinPaie.cotisationIPRES | number:'1.0-0' }}</td></tr>
                    <tr><td>CSS (7%)</td><td class="text-end text-danger">{{ bulletinPaie.cotisationCSS | number:'1.0-0' }}</td></tr>
                    <tr><td>IRPP</td><td class="text-end text-danger">{{ bulletinPaie.impotSurRevenu | number:'1.0-0' }}</td></tr>
                    <tr *ngIf="(bulletinPaie.deductionAbsences||0)>0">
                      <td>Abs. ({{ bulletinPaie.joursAbsenceNonJustifie }}j)</td>
                      <td class="text-end text-danger">{{ bulletinPaie.deductionAbsences | number:'1.0-0' }}</td>
                    </tr>
                    <tr class="table-light fw-bold">
                      <td>TOTAL RETENUES</td>
                      <td class="text-end text-danger">{{ getTotalRetenues() | number:'1.0-0' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- Net à payer -->
            <div class="text-center border-2 border p-3 bg-success text-white rounded mb-4">
              <div class="fs-4 fw-bold">NET À PAYER : {{ bulletinPaie.salaireNet | number:'1.0-0' }} FCFA</div>
              <div class="small">{{ bulletinPaie.modePaiement || 'En attente de paiement' }} — {{ bulletinPaie.datePaiement | date:'dd/MM/yyyy' }}</div>
            </div>
            <!-- Signatures -->
            <div class="d-flex justify-content-between mt-4">
              <div class="text-center">
                <div class="fw-bold text-decoration-underline mb-4">L'ENSEIGNANT</div>
                <div class="border-bottom border-dark" style="width:120px;margin:auto;"></div>
              </div>
              <div class="text-center">
                <div class="fw-bold text-decoration-underline mb-4">LE DIRECTEUR</div>
                <div class="border-bottom border-dark" style="width:120px;margin:auto;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      @media print {
        .no-print { display: none !important; }
        .modal { position: static !important; background: white !important; }
        .modal-dialog { max-width: 100% !important; margin: 0 !important; }
        .modal-content { border: none !important; box-shadow: none !important; }
      }
    </style>
  `
})
export class SalairesComponent implements OnInit {
  activeTab = 'fiches';
  salaires: SalaireProfesseur[] = [];
  configs: ConfigurationSalaire[] = [];
  enseignants: User[] = [];
  statsData: any = null;
  filterMois = new Date().toISOString().slice(0, 7);
  filterStatut = '';
  anneeScol = '2023-2024';
  saving = false;
  totalMasse = 0;
  showGenererModal = false;
  payerModal: SalaireProfesseur | null = null;
  configModal = false;
  bulletinPaie: SalaireProfesseur | null = null;
  editConfig: ConfigurationSalaire | null = null;
  genResult: any = null;
  genForm: any = { mois: new Date().toISOString().slice(0, 7), joursOuvres: 26, anneeScol: '2023-2024' };
  payerForm: any = { modePaiement: 'VIREMENT' };
  configForm: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getUsers('ENSEIGNANT').subscribe(u => this.enseignants = u);
    this.loadSalaires();
  }

  loadSalaires() {
    const params: any = {};
    if (this.filterMois) params['mois'] = this.filterMois;
    this.api.getSalaires(params).subscribe(s => {
      this.salaires = s.filter(x => !this.filterStatut || x.statut === this.filterStatut);
      this.totalMasse = this.salaires.reduce((t, x) => t + (x.salaireNet || 0), 0);
    });
  }

  loadConfigs() {
    this.api.getConfigsSalaires().subscribe(c => this.configs = c);
  }

  loadStats() {
    this.api.getSalaireStats(this.anneeScol, this.filterMois).subscribe(s => this.statsData = s);
  }

  genererFiches() {
    this.saving = true;
    this.api.genererFichesPaie(this.genForm).subscribe({
      next: (r) => { this.genResult = r; this.saving = false; this.loadSalaires(); },
      error: () => this.saving = false
    });
  }

  openPayerModal(s: SalaireProfesseur) {
    this.payerModal = s;
    this.payerForm = { modePaiement: 'VIREMENT', referenceVirement: '' };
  }

  payerSalaire() {
    if (!this.payerModal?.id) return;
    this.saving = true;
    this.api.payerSalaire(this.payerModal.id, this.payerForm).subscribe({
      next: () => { this.payerModal = null; this.saving = false; this.loadSalaires(); },
      error: () => this.saving = false
    });
  }

  valider(s: SalaireProfesseur) {
    if (!s.id) return;
    this.api.validerSalaire(s.id, {}).subscribe(() => this.loadSalaires());
  }

  openConfigModal(c?: ConfigurationSalaire) {
    this.editConfig = c || null;
    this.configForm = c ? {
      enseignantId: c.enseignant?.id, salaireBase: c.salaireBase,
      primeAnciennete: c.primeAnciennete, indemnitesTransport: c.indemnitesTransport,
      indemnitesLogement: c.indemnitesLogement, autresIndemnites: c.autresIndemnites,
      anneesAnciennete: c.anneesAnciennete, niveauQualification: c.niveauQualification,
      anneeScol: c.anneeScol || this.anneeScol
    } : { anneeScol: this.anneeScol, salaireBase: 150000, indemnitesTransport: 15000 };
    this.configModal = true;
  }

  saveConfig() {
    this.saving = true;
    this.api.saveConfigSalaire(this.configForm).subscribe({
      next: () => { this.configModal = false; this.saving = false; this.loadConfigs(); },
      error: () => this.saving = false
    });
  }

  voirBulletin(s: SalaireProfesseur) { this.bulletinPaie = s; }

  estimateBrut(): number {
    return (this.configForm.salaireBase || 0) + (this.configForm.primeAnciennete || 0)
         + (this.configForm.indemnitesTransport || 0) + (this.configForm.indemnitesLogement || 0);
  }

  getTotalRetenues(): number {
    if (!this.bulletinPaie) return 0;
    return (this.bulletinPaie.cotisationIPRES || 0) + (this.bulletinPaie.cotisationCSS || 0)
         + (this.bulletinPaie.impotSurRevenu || 0) + (this.bulletinPaie.deductionAbsences || 0);
  }

  formatMois(mois: string): string {
    const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const [y, m] = mois.split('-');
    return `${moisNoms[+m - 1]} ${y}`;
  }
}
