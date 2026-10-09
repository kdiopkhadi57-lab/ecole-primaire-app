import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PaiementEleve, PaiementStats, Classe, Eleve } from '../../models/models';

@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Comptabilité Scolaire</h3>
          <p class="text-muted mb-0">Gestion des paiements et frais de scolarité</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success" (click)="showInscrireModal = true">
            <i class="bi bi-gear me-1"></i>Créer frais par classe
          </button>
          <button class="btn btn-outline-primary" (click)="showRapport = !showRapport; loadRapportJournalier()">
            <i class="bi bi-calendar2-check me-1"></i>Rapport journalier
          </button>
          <button class="btn btn-success" (click)="openModal()">
            <i class="bi bi-plus-circle me-1"></i>Nouveau paiement
          </button>
        </div>
      </div>

      <!-- Stats cards -->
      <div class="row g-3 mb-4" *ngIf="stats">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm text-center py-3" style="border-top: 4px solid #1a6b3c !important;">
            <div class="fs-2 fw-bold text-success">{{ stats.totalEncaisse | number:'1.0-0' }} <small class="fs-6">FCFA</small></div>
            <div class="text-muted small">Total encaissé</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm text-center py-3" style="border-top: 4px solid #dc3545 !important;">
            <div class="fs-2 fw-bold text-danger">{{ stats.totalRestant | number:'1.0-0' }} <small class="fs-6">FCFA</small></div>
            <div class="text-muted small">Reste à recouvrer</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm text-center py-3" style="border-top: 4px solid #fd7e14 !important;">
            <div class="fs-2 fw-bold text-warning">{{ stats.nbImpayes }}</div>
            <div class="text-muted small">Élèves avec impayés</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm text-center py-3" style="border-top: 4px solid #0d6efd !important;">
            <div class="fs-2 fw-bold text-primary">{{ getTauxRecouvrement() }}%</div>
            <div class="text-muted small">Taux de recouvrement</div>
          </div>
        </div>
      </div>

      <!-- Rapport journalier comptable -->
      <div class="card border-0 shadow-sm mb-3" *ngIf="showRapport">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <strong><i class="bi bi-journal-text me-2"></i>Rapport journalier de caisse</strong>
          <div class="d-flex gap-2 align-items-center">
            <input type="date" class="form-control form-control-sm" [(ngModel)]="rapportDate" (change)="loadRapportJournalier()">
            <button class="btn btn-light btn-sm" (click)="imprimerRapport()"><i class="bi bi-printer"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div class="row g-2 mb-3">
            <div class="col-md-3"><div class="border rounded p-2"><small class="text-muted">Total du jour</small><div class="fw-bold text-primary">{{ rapport.total | number:'1.0-0' }} FCFA</div></div></div>
            <div class="col-md-3"><div class="border rounded p-2"><small class="text-muted">Inscriptions versées</small><div class="fw-bold text-success">{{ rapport.totalInscriptions | number:'1.0-0' }} FCFA</div></div></div>
            <div class="col-md-3"><div class="border rounded p-2"><small class="text-muted">Scolarité / mois d'avance</small><div class="fw-bold text-info">{{ rapport.totalScolarite | number:'1.0-0' }} FCFA</div></div></div>
            <div class="col-md-3"><div class="border rounded p-2"><small class="text-muted">Élèves payeurs</small><div class="fw-bold">{{ rapport.nombreEleves }}</div></div></div>
          </div>
          <div class="table-responsive" id="rapport-journalier-print">
            <table class="table table-sm table-bordered mb-0">
              <thead class="table-light"><tr><th>Élève</th><th>Classe</th><th>Inscription versée</th><th>Mois d'avance</th><th>Année complète</th><th class="text-end">Total payé</th></tr></thead>
              <tbody>
                <tr *ngFor="let ligne of rapport.lignes">
                  <td><strong>{{ ligne.eleve }}</strong><br><small class="text-muted">{{ ligne.matricule }}</small></td>
                  <td><span class="badge bg-success">{{ ligne.classe }}</span></td>
                  <td>{{ ligne.inscriptionVersee | number:'1.0-0' }} FCFA</td>
                  <td>{{ ligne.moisAvance?.length ? ligne.moisAvance.join(', ') : '—' }}</td>
                  <td><span class="badge" [class.bg-success]="ligne.anneeCompletePayee" [class.bg-secondary]="!ligne.anneeCompletePayee">{{ ligne.anneeCompletePayee ? 'Oui' : 'Non' }}</span></td>
                  <td class="text-end fw-bold">{{ ligne.totalPaye | number:'1.0-0' }} FCFA</td>
                </tr>
                <tr *ngIf="!rapport.lignes.length"><td colspan="6" class="text-center text-muted py-3">Aucun paiement enregistré à cette date.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-md-2">
              <select class="form-select form-select-sm" [(ngModel)]="filterClasse" (change)="loadPaiements()">
                <option value="">Toutes les classes</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select form-select-sm" [(ngModel)]="filterStatut" (change)="loadPaiements()">
                <option value="">Tous les statuts</option>
                <option value="PAYE">Payé</option>
                <option value="PARTIEL">Partiel</option>
                <option value="IMPAYE">Impayé</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select form-select-sm" [(ngModel)]="filterType" (change)="loadPaiements()">
                <option value="">Tous les types</option>
                <option value="INSCRIPTION">Inscription</option>
                <option value="SCOLARITE_T1">Scolarité T1</option>
                <option value="SCOLARITE_T2">Scolarité T2</option>
                <option value="SCOLARITE_T3">Scolarité T3</option>
                <option value="CANTINE">Cantine</option>
                <option value="TRANSPORT">Transport</option>
              </select>
            </div>
            <div class="col-md-3">
              <input class="form-control form-control-sm" [(ngModel)]="searchText" placeholder="Rechercher un élève...">
            </div>
            <div class="col-auto">
              <span class="badge bg-secondary">{{ filteredPaiements.length }} entrée(s)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead style="background:#1a6b3c;color:white;">
              <tr>
                <th>Élève / Classe</th>
                <th>Type</th>
                <th class="text-end">Montant dû</th>
                <th class="text-end">Payé</th>
                <th class="text-end">Restant</th>
                <th class="text-center">Statut</th>
                <th>Date paiement</th>
                <th>Mode</th>
                <th>Réf. reçu</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredPaiements">
                <td>
                  <div class="fw-semibold">{{ p.eleve?.prenom }} {{ p.eleve?.nom }}</div>
                  <span class="badge bg-success small">{{ p.eleve?.classe?.nom }}</span>
                </td>
                <td><span class="badge bg-light text-dark border">{{ getTypelabel(p.typePaiement) }}</span></td>
                <td class="text-end fw-semibold">{{ p.montantDu | number:'1.0-0' }}<small class="text-muted"> F</small></td>
                <td class="text-end text-success fw-semibold">{{ p.montantPaye | number:'1.0-0' }}<small class="text-muted"> F</small></td>
                <td class="text-end" [class.text-danger]="(p.montantRestant||0) > 0" [class.text-success]="(p.montantRestant||0) === 0">
                  {{ p.montantRestant | number:'1.0-0' }}<small class="text-muted"> F</small>
                </td>
                <td class="text-center">
                  <span class="badge"
                        [class.bg-success]="p.statut === 'PAYE'"
                        [class.bg-warning]="p.statut === 'PARTIEL'"
                        [class.text-dark]="p.statut === 'PARTIEL'"
                        [class.bg-danger]="p.statut === 'IMPAYE'">
                    {{ p.statut }}
                  </span>
                </td>
                <td class="small">{{ p.datePaiement | date:'dd/MM/yyyy' }}</td>
                <td class="small text-muted">{{ p.modePaiement || '—' }}</td>
                <td><code class="small">{{ p.referenceRecu || '—' }}</code></td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-success me-1" title="Imprimer reçu" (click)="imprimerRecu(p)">
                    <i class="bi bi-printer"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="openModal(p)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deletePaiement(p)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredPaiements.length === 0">
                <td colspan="10" class="text-center text-muted py-5">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>Aucun paiement trouvé
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Paiement Modal -->
    <div class="modal fade show d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header" style="background:#1a6b3c;color:white;">
            <h5 class="modal-title">
              <i class="bi bi-cash-coin me-2"></i>{{ editPaiement?.id ? 'Modifier' : 'Enregistrer' }} un paiement
            </h5>
            <button class="btn-close btn-close-white" (click)="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Classe</label>
                <select class="form-select" [(ngModel)]="form.classeId" (change)="loadElevesClasse()">
                  <option value="">— Sélectionner —</option>
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Élève</label>
                <select class="form-select" [(ngModel)]="form.eleveId">
                  <option value="">— Sélectionner —</option>
                  <option *ngFor="let e of elevesModal" [value]="e.id">{{ e.prenom }} {{ e.nom }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Type de paiement</label>
                <select class="form-select" [(ngModel)]="form.typePaiement">
                  <option value="INSCRIPTION">Inscription</option>
                  <option value="SCOLARITE_T1">Scolarité T1</option>
                  <option value="SCOLARITE_T2">Scolarité T2</option>
                  <option value="SCOLARITE_T3">Scolarité T3</option>
                  <option value="CANTINE">Cantine</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Mode de paiement</label>
                <select class="form-select" [(ngModel)]="form.modePaiement">
                  <option value="ESPECES">Espèces</option>
                  <option value="VIREMENT">Virement bancaire</option>
                  <option value="MOBILE_MONEY">Mobile Money (Wave/Orange)</option>
                  <option value="CHEQUE">Chèque</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Montant dû (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="form.montantDu" (input)="computeRestant()">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Montant payé (FCFA)</label>
                <input type="number" class="form-control" [(ngModel)]="form.montantPaye" (input)="computeRestant()">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Restant (FCFA)</label>
                <input type="number" class="form-control bg-light" [value]="form.montantRestant" readonly>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Date de paiement</label>
                <input type="date" class="form-control" [(ngModel)]="form.datePaiement">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Date d'échéance</label>
                <input type="date" class="form-control" [(ngModel)]="form.dateEcheance">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Année scolaire</label>
                <input class="form-control" [(ngModel)]="form.anneeScol">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Notes / Observations</label>
                <textarea class="form-control" [(ngModel)]="form.notes" rows="2"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showModal = false">Annuler</button>
            <button class="btn btn-success" (click)="savePaiement()" [disabled]="saving">
              <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Créer frais par classe Modal -->
    <div class="modal fade show d-block" *ngIf="showInscrireModal" style="background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header" style="background:#1a6b3c;color:white;">
            <h5 class="modal-title"><i class="bi bi-gear me-2"></i>Créer les frais pour une classe</h5>
            <button class="btn-close btn-close-white" (click)="showInscrireModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info small">Crée automatiquement les frais d'inscription + scolarité T1/T2/T3 pour tous les élèves de la classe.</div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Classe</label>
              <select class="form-select" [(ngModel)]="inscForm.classeId">
                <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Montant inscription (FCFA)</label>
              <input type="number" class="form-control" [(ngModel)]="inscForm.montantInscription">
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Montant scolarité / trimestre (FCFA)</label>
              <input type="number" class="form-control" [(ngModel)]="inscForm.montantScolarite">
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Année scolaire</label>
              <input class="form-control" [(ngModel)]="inscForm.anneeScol">
            </div>
            <div *ngIf="inscResult" class="alert alert-success small">
              <i class="bi bi-check-circle me-1"></i>{{ inscResult.created }} frais créés pour {{ inscResult.eleves }} élève(s).
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showInscrireModal = false">Fermer</button>
            <button class="btn btn-success" (click)="inscrireClasse()" [disabled]="saving">Créer les frais</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reçu de paiement imprimable -->
    <div class="modal fade show d-block" *ngIf="recuPaiement" style="background:rgba(0,0,0,0.7)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header no-print">
            <h5 class="modal-title">Reçu de paiement</h5>
            <div class="d-flex gap-2">
              <button class="btn btn-success btn-sm" onclick="window.print()">
                <i class="bi bi-printer me-1"></i>Imprimer
              </button>
              <button class="btn-close" (click)="recuPaiement = null"></button>
            </div>
          </div>
          <div class="modal-body p-4" id="recu-print">
            <div class="text-center mb-4">
              <h4 class="fw-bold">INSTITUT ANNOUR</h4>
              <div class="text-muted small">IEF/IA de Diourbel — Année {{ recuPaiement.anneeScol }}</div>
              <hr>
              <h5 class="fw-bold text-decoration-underline mt-2">REÇU DE PAIEMENT</h5>
            </div>
            <div class="row g-2 small mb-3">
              <div class="col-6"><strong>N° Reçu :</strong> {{ recuPaiement.referenceRecu }}</div>
              <div class="col-6 text-end"><strong>Date :</strong> {{ recuPaiement.datePaiement | date:'dd/MM/yyyy' }}</div>
              <div class="col-6"><strong>Élève :</strong> {{ recuPaiement.eleve?.prenom }} {{ recuPaiement.eleve?.nom }}</div>
              <div class="col-6"><strong>Classe :</strong> {{ recuPaiement.eleve?.classe?.nom }}</div>
              <div class="col-6"><strong>Matricule :</strong> {{ recuPaiement.eleve?.matricule }}</div>
              <div class="col-6"><strong>Mode paiement :</strong> {{ recuPaiement.modePaiement }}</div>
            </div>
            <table class="table table-bordered small mb-4">
              <thead class="table-dark">
                <tr>
                  <th>Désignation</th>
                  <th class="text-end">Montant dû</th>
                  <th class="text-end">Montant payé</th>
                  <th class="text-end">Restant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ getTypelabel(recuPaiement.typePaiement) }}</td>
                  <td class="text-end">{{ recuPaiement.montantDu | number:'1.0-0' }} FCFA</td>
                  <td class="text-end fw-bold text-success">{{ recuPaiement.montantPaye | number:'1.0-0' }} FCFA</td>
                  <td class="text-end" [class.text-danger]="(recuPaiement.montantRestant||0)>0">{{ recuPaiement.montantRestant | number:'1.0-0' }} FCFA</td>
                </tr>
              </tbody>
            </table>
            <div class="row mt-5 pt-3">
              <div class="col-6 text-center">
                <div class="border-bottom border-dark" style="width:120px;margin:auto;"></div>
                <div class="small mt-1">Signature du caissier</div>
              </div>
              <div class="col-6 text-center">
                <div class="border-bottom border-dark" style="width:120px;margin:auto;"></div>
                <div class="small mt-1">Signature du parent</div>
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
export class PaiementsComponent implements OnInit {
  paiements: PaiementEleve[] = [];
  classes: Classe[] = [];
  elevesModal: Eleve[] = [];
  stats: PaiementStats | null = null;
  showModal = false;
  showInscrireModal = false;
  editPaiement: PaiementEleve | null = null;
  recuPaiement: PaiementEleve | null = null;
  saving = false;
  filterClasse = '';
  filterStatut = '';
  filterType = '';
  searchText = '';
  anneeScol = '2023-2024';
  form: any = {};
  inscForm: any = { montantInscription: 15000, montantScolarite: 25000, anneeScol: '2023-2024' };
  inscResult: any = null;
  showRapport = false;
  rapportDate = new Date().toISOString().slice(0, 10);
  rapport: any = { total: 0, totalInscriptions: 0, totalScolarite: 0, nombreEleves: 0, lignes: [] };

  get filteredPaiements() {
    return this.paiements.filter(p => {
      const name = `${p.eleve?.prenom} ${p.eleve?.nom}`.toLowerCase();
      return (!this.searchText || name.includes(this.searchText.toLowerCase()))
          && (!this.filterStatut || p.statut === this.filterStatut)
          && (!this.filterType || p.typePaiement === this.filterType);
    });
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getClasses().subscribe(c => this.classes = c);
    this.loadPaiements();
    this.loadStats();
  }

  loadPaiements() {
    const params: any = { anneeScol: this.anneeScol };
    if (this.filterClasse) params['classeId'] = this.filterClasse;
    this.api.getPaiements(params).subscribe(p => this.paiements = p);
  }

  loadStats() {
    this.api.getPaiementStats(this.anneeScol).subscribe(s => this.stats = s);
  }

  loadRapportJournalier() {
    this.api.getRapportPaiementsJournalier(this.rapportDate, this.anneeScol)
      .subscribe(r => this.rapport = r);
  }

  imprimerRapport() {
    window.print();
  }

  getTauxRecouvrement(): number {
    if (!this.stats) return 0;
    const total = (this.stats.totalEncaisse || 0) + (this.stats.totalRestant || 0);
    return total > 0 ? Math.round((this.stats.totalEncaisse / total) * 100) : 0;
  }

  openModal(p?: PaiementEleve) {
    this.editPaiement = p || null;
    this.form = p ? {
      eleveId: p.eleve?.id, classeId: p.eleve?.classe?.id,
      typePaiement: p.typePaiement, modePaiement: p.modePaiement,
      montantDu: p.montantDu, montantPaye: p.montantPaye, montantRestant: p.montantRestant,
      datePaiement: p.datePaiement, dateEcheance: p.dateEcheance,
      anneeScol: p.anneeScol, notes: p.notes
    } : { typePaiement: 'SCOLARITE_T1', modePaiement: 'ESPECES', montantPaye: 0, anneeScol: this.anneeScol };
    if (this.form.classeId) this.loadElevesClasse();
    this.showModal = true;
  }

  loadElevesClasse() {
    if (this.form.classeId) {
      this.api.getEleves(+this.form.classeId).subscribe(e => this.elevesModal = e);
    }
  }

  computeRestant() {
    this.form.montantRestant = Math.max(0, (this.form.montantDu || 0) - (this.form.montantPaye || 0));
  }

  savePaiement() {
    this.saving = true;
    const obs = this.editPaiement?.id
        ? this.api.updatePaiement(this.editPaiement.id, this.form)
        : this.api.createPaiement(this.form);
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.loadPaiements(); this.loadStats(); },
      error: () => this.saving = false
    });
  }

  deletePaiement(p: PaiementEleve) {
    if (!p.id || !confirm('Supprimer ce paiement ?')) return;
    this.api.deletePaiement(p.id).subscribe(() => { this.loadPaiements(); this.loadStats(); });
  }

  inscrireClasse() {
    this.saving = true;
    this.api.inscrireClasse(this.inscForm).subscribe({
      next: (r) => { this.inscResult = r; this.saving = false; this.loadPaiements(); this.loadStats(); },
      error: () => this.saving = false
    });
  }

  imprimerRecu(p: PaiementEleve) { this.recuPaiement = p; }

  getTypelabel(type: string): string {
    const labels: any = {
      INSCRIPTION: 'Frais d\'inscription', SCOLARITE_T1: 'Scolarité Trimestre 1',
      SCOLARITE_T2: 'Scolarité Trimestre 2', SCOLARITE_T3: 'Scolarité Trimestre 3',
      CANTINE: 'Cantine scolaire', TRANSPORT: 'Transport scolaire', AUTRE: 'Autre'
    };
    return labels[type] || type;
  }
}
