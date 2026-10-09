import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4" *ngIf="portal; else loading">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1">Portail parent</h3>
          <p class="text-muted mb-0">
            Suivi de {{ portal.eleve.prenom }} {{ portal.eleve.nom }}
            <span *ngIf="portal.eleve.classe">· {{ portal.eleve.classe.nom }}</span>
          </p>
        </div>
        <span class="badge bg-success fs-6 px-3">{{ portal.anneeScol }}</span>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="text-muted small">Notes publiées</div>
              <div class="fs-2 fw-bold">{{ portal.notes.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="text-muted small">Bulletins disponibles</div>
              <div class="fs-2 fw-bold">{{ portal.bulletins.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="text-muted small">Devoirs et compositions programmés</div>
              <div class="fs-2 fw-bold">{{ portal.devoirs.length }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold"><i class="bi bi-currency-exchange text-success me-2"></i>Facture proforma</h5>
            <button class="btn btn-sm btn-outline-primary no-print" (click)="showInvoice = true" type="button">
              <i class="bi bi-printer me-1"></i>Voir facture
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="row g-2 small">
            <div class="col-md-4"><strong>Inscription :</strong> {{ getMontantInscription() | number:'1.0-0' }} FCFA</div>
            <div class="col-md-4"><strong>Versement Juillet :</strong> {{ getVersementJuillet() | number:'1.0-0' }} FCFA</div>
            <div class="col-md-4"><strong>Solde :</strong> {{ getSoldeTotal() | number:'1.0-0' }} FCFA</div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold"><i class="bi bi-person-vcard text-success me-2"></i>CIN scolaire</h5>
            <button class="btn btn-sm btn-outline-dark no-print" (click)="showCin = true" type="button">
              <i class="bi bi-printer me-1"></i>Voir CIN
            </button>
          </div>
        </div>
        <div class="card-body small">
          <div class="row g-2">
            <div class="col-md-6"><strong>Élève :</strong> {{ portal.eleve.prenom }} {{ portal.eleve.nom }}</div>
            <div class="col-md-6"><strong>Matricule :</strong> {{ portal.eleve.matricule || '—' }}</div>
            <div class="col-md-6"><strong>Classe :</strong> {{ portal.eleve.classe?.nom || '—' }}</div>
            <div class="col-md-6"><strong>Année :</strong> {{ portal.eleve.anneeScol || portal.anneeScol }}</div>
            <div class="col-md-6"><strong>École d'origine :</strong> {{ portal.eleve.ecoleOrigine || '—' }}</div>
            <div class="col-md-6"><strong>Classe année passée :</strong> {{ portal.eleve.classeAnneePrecedente || '—' }}</div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3">
          <h5 class="mb-0 fw-bold"><i class="bi bi-pencil-square text-success me-2"></i>Notes</h5>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light"><tr><th>Matière</th><th>Semestre</th><th>Ressources</th><th>Compétences</th><th>Total</th><th>Appréciation</th></tr></thead>
            <tbody>
              <tr *ngFor="let note of portal.notes">
                <td>{{ note.matiere?.nom }}</td>
                <td>{{ note.semestre }}</td>
                <td>{{ note.noteRessources ?? '-' }}</td>
                <td>{{ note.noteCompetences ?? '-' }}</td>
                <td class="fw-semibold">{{ note.total ?? '-' }}</td>
                <td>{{ note.appreciation || '-' }}</td>
              </tr>
              <tr *ngIf="!portal.notes.length"><td colspan="6" class="text-center text-muted py-4">Aucune note publiée.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3">
          <h5 class="mb-0 fw-bold"><i class="bi bi-calendar-event text-success me-2"></i>Devoirs et compositions</h5>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light"><tr><th>Type</th><th>Titre</th><th>Matière</th><th>Date prévue</th><th>Description</th></tr></thead>
            <tbody>
              <tr *ngFor="let devoir of portal.devoirs">
                <td><span class="badge" [class.bg-danger]="devoir.type === 'COMPOSITION'" [class.bg-primary]="devoir.type !== 'COMPOSITION'">{{ devoir.type }}</span></td>
                <td class="fw-semibold">{{ devoir.titre }}</td>
                <td>{{ devoir.matiere?.nom || '-' }}</td>
                <td>{{ devoir.datePrevue ? (devoir.datePrevue | date:'dd/MM/yyyy') : '-' }}</td>
                <td>{{ devoir.description || '-' }}</td>
              </tr>
              <tr *ngIf="!portal.devoirs.length"><td colspan="5" class="text-center text-muted py-4">Aucun devoir programmé.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white py-3">
          <h5 class="mb-0 fw-bold"><i class="bi bi-file-earmark-text text-success me-2"></i>Bulletins</h5>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light"><tr><th>Semestre</th><th>Moyenne</th><th>Rang</th><th>Appréciation</th><th>Date</th></tr></thead>
            <tbody>
              <tr *ngFor="let bulletin of portal.bulletins">
                <td>{{ bulletin.semestre }}</td>
                <td class="fw-semibold">{{ bulletin.moyenne ?? '-' }}/20</td>
                <td>{{ bulletin.rang || '-' }}</td>
                <td>{{ bulletin.appreciation || '-' }}</td>
                <td>{{ bulletin.dateGeneration ? (bulletin.dateGeneration | date:'dd/MM/yyyy') : '-' }}</td>
              </tr>
              <tr *ngIf="!portal.bulletins.length"><td colspan="5" class="text-center text-muted py-4">Aucun bulletin disponible.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal fade show d-block print-modal" *ngIf="showInvoice" style="background:rgba(0,0,0,0.7);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header no-print" style="background:#f4b942; color:#111;">
            <h5 class="modal-title"><i class="bi bi-receipt me-2"></i>Facture proforma</h5>
            <div class="d-flex gap-2">
              <button class="btn btn-dark btn-sm" type="button" (click)="printCurrentModal()"><i class="bi bi-printer me-1"></i>Imprimer</button>
              <button class="btn-close" type="button" (click)="showInvoice = false"></button>
            </div>
          </div>
          <div class="modal-body p-4" id="facture-print">
            <div class="text-center mb-3">
              <h4 class="fw-bold mb-0">INSTITUT ANNOUR</h4>
              <div class="text-muted small">IEF/IA de Diourbel</div>
              <div class="fw-bold text-decoration-underline mt-2">FACTURE PROFORMA</div>
            </div>
            <div class="row small mb-3">
              <div class="col-md-6"><strong>Élève :</strong> {{ portal.eleve.prenom }} {{ portal.eleve.nom }}</div>
              <div class="col-md-6 text-md-end"><strong>Classe :</strong> {{ portal.eleve.classe?.nom || '—' }}</div>
              <div class="col-md-6"><strong>Matricule :</strong> {{ portal.eleve.matricule || '—' }}</div>
              <div class="col-md-6 text-md-end"><strong>Année :</strong> {{ portal.anneeScol }}</div>
            </div>

            <table class="table table-bordered table-sm mb-3">
              <thead class="table-light">
                <tr><th>Mois</th><th>Montant</th><th>Versement juillet</th><th>Solde</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of getFactureRows()">
                  <td>{{ row.mois }}</td>
                  <td>{{ row.montant | number:'1.0-0' }} FCFA</td>
                  <td>{{ row.versement | number:'1.0-0' }} FCFA</td>
                  <td>{{ row.solde | number:'1.0-0' }} FCFA</td>
                </tr>
                <tr>
                  <td class="fw-bold">Inscription</td>
                  <td>{{ getMontantInscription() | number:'1.0-0' }} FCFA</td>
                  <td>0 FCFA</td>
                  <td>{{ getMontantInscription() | number:'1.0-0' }} FCFA</td>
                </tr>
              </tbody>
            </table>

            <div class="d-flex justify-content-between fw-bold border-top pt-3">
              <span>Total à payer</span>
              <span>{{ getSoldeTotal() | number:'1.0-0' }} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade show d-block print-modal" *ngIf="showCin" style="background:rgba(0,0,0,0.7);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header no-print" style="background:#1a6b3c; color:#fff;">
            <h5 class="modal-title"><i class="bi bi-person-vcard me-2"></i>CIN Scolaire</h5>
            <div class="d-flex gap-2">
              <button class="btn btn-light btn-sm" type="button" (click)="printCurrentModal()"><i class="bi bi-printer me-1"></i>Imprimer</button>
              <button class="btn-close btn-close-white" type="button" (click)="showCin = false"></button>
            </div>
          </div>
          <div class="modal-body p-4" id="cin-print">
            <div class="text-center mb-3">
              <h5 class="fw-bold mb-0">INSTITUT ANNOUR</h5>
              <div class="text-muted small">IEF / IA de Diourbel</div>
              <div class="fw-bold text-decoration-underline mt-2">CARTE D'IDENTITÉ SCOLAIRE</div>
            </div>
            <div class="d-flex gap-3 align-items-start border border-2 border-dark p-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                   style="width:70px;height:70px;font-size:1.5rem;"
                   [style.background]="portal.eleve.sexe === 'F' ? '#e91e63' : '#1a6b3c'">
                {{ ((portal.eleve.prenom || 'A')[0] + (portal.eleve.nom || 'A')[0]).toUpperCase() }}
              </div>
              <div class="small flex-grow-1">
                <div><strong>Matricule :</strong> {{ portal.eleve.matricule || '—' }}</div>
                <div><strong>Nom :</strong> {{ portal.eleve.nom }}</div>
                <div><strong>Prénom :</strong> {{ portal.eleve.prenom }}</div>
                <div><strong>Né(e) le :</strong> {{ portal.eleve.dateNaissance ? (portal.eleve.dateNaissance | date:'dd/MM/yyyy') : '—' }} à {{ portal.eleve.lieuNaissance || '—' }}</div>
                <div><strong>Sexe :</strong> {{ portal.eleve.sexe === 'F' ? 'Féminin' : 'Masculin' }}</div>
                <div><strong>Classe :</strong> {{ portal.eleve.classe?.nom }}</div>
                <div><strong>Année scolaire :</strong> {{ portal.eleve.anneeScol || portal.anneeScol }}</div>
              </div>
            </div>
            <div class="small mt-3">
              <div class="fw-semibold border-bottom pb-1 mb-1">Informations de l'inscription</div>
              <div><strong>Nom du père :</strong> {{ portal.eleve.nomPere || '—' }}</div>
              <div><strong>Nom de la mère :</strong> {{ portal.eleve.nomMere || '—' }}</div>
              <div><strong>Téléphone parent :</strong> {{ portal.eleve.telephoneParent || '—' }}</div>
              <div><strong>Adresse :</strong> {{ portal.eleve.adresse || '—' }}</div>
              <div><strong>École d'origine :</strong> {{ portal.eleve.ecoleOrigine || '—' }}</div>
              <div><strong>Classe année précédente :</strong> {{ portal.eleve.classeAnneePrecedente || '—' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="p-5 text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Chargement du portail...</div>
    </ng-template>

    <style>
      body.print-mode > *:not(.print-modal) {
        display: none !important;
      }

      body.print-mode .print-modal {
        display: block !important;
        position: static !important;
        background: transparent !important;
      }

      body.print-mode .print-modal .modal-dialog {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
      }

      body.print-mode .print-modal .modal-content {
        border: none !important;
        box-shadow: none !important;
      }

      body.print-mode .no-print {
        display: none !important;
      }
    </style>
  `
})
export class ParentPortalComponent implements OnInit {
  portal: any;
  showInvoice = false;
  showCin = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getParentPortal().subscribe({
      next: data => this.portal = data,
      error: () => this.portal = { eleve: { prenom: '', nom: '' }, notes: [], bulletins: [], devoirs: [], anneeScol: '' }
    });
  }

  getMontantInscription(): number {
    return Number(this.portal?.eleve?.montantInscription ?? 0);
  }

  getVersementJuillet(): number {
    return Number(this.portal?.eleve?.sommeVerseJuillet ?? 0);
  }

  getSoldeTotal(): number {
    const montantMensuel = Number(this.portal?.eleve?.montantMensuel ?? 0);
    return this.getMontantInscription() + (montantMensuel * 10) - this.getVersementJuillet();
  }

  getFactureRows(): Array<{ mois: string; montant: number; versement: number; solde: number }> {
    const mois = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet'];
    const montantMensuel = Number(this.portal?.eleve?.montantMensuel ?? 0);
    return mois.map((label, index) => ({
      mois: label,
      montant: montantMensuel,
      versement: index === 9 ? this.getVersementJuillet() : 0,
      solde: index === 9 ? Math.max(montantMensuel - this.getVersementJuillet(), 0) : montantMensuel
    }));
  }

  printCurrentModal(): void {
    document.body.classList.add('print-mode');
    setTimeout(() => window.print(), 200);
    setTimeout(() => document.body.classList.remove('print-mode'), 1000);
  }
}
