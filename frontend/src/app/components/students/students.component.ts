import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Eleve, Classe } from '../../models/models';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4">

  <!-- Header -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h3 class="fw-bold mb-1">👨‍🎓 Gestion des Élèves</h3>
      <p class="text-muted mb-0">Inscriptions et suivi des élèves</p>
    </div>
    <div class="d-flex gap-2">
      <button class="btn btn-outline-success" (click)="showImport=true">
        <i class="bi bi-cloud-upload me-1"></i>Import Excel
      </button>
      <button class="btn btn-success" (click)="openModal()">
        <i class="bi bi-plus-circle me-1"></i>Nouvel élève
      </button>
    </div>
  </div>

  <!-- Filtres -->
  <div class="card border-0 shadow-sm mb-4">
    <div class="card-body py-2">
      <div class="row g-2 align-items-center">
        <div class="col-md-3">
          <select class="form-select form-select-sm" [(ngModel)]="selectedClasse" (change)="loadEleves()">
            <option value="">Toutes les classes</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }} ({{ c.effectifs || 0 }})</option>
          </select>
        </div>
        <div class="col-md-4">
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input class="form-control" [(ngModel)]="searchText" placeholder="Rechercher par nom, matricule…">
          </div>
        </div>
        <div class="col-md-2">
          <select class="form-select form-select-sm" [(ngModel)]="filtreSexe">
            <option value="">Tous</option>
            <option value="M">Garçons</option>
            <option value="F">Filles</option>
          </select>
        </div>
        <div class="col-md-3 text-end">
          <span class="badge bg-secondary">{{ filteredEleves.length }} élève(s)</span>
          <span class="badge ms-1" [class.bg-success]="emailCount > 0" [class.bg-secondary]="emailCount===0">
            <i class="bi bi-envelope me-1"></i>{{ emailCount }} email(s) parent
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="card border-0 shadow-sm">
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead style="background:#f8f9fa;">
          <tr>
            <th>Matricule</th>
            <th>Élève</th>
            <th>Naissance</th>
            <th>Classe</th>
            <th>Parent / Contact</th>
            <th>📧 Email parent</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of filteredEleves">
            <td><code class="small">{{ e.matricule }}</code></td>
            <td>
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                     style="width:34px;height:34px;font-size:.75rem;flex-shrink:0;"
                     [style.background]="e.sexe==='F' ? '#e91e63' : '#1a6b3c'">
                  {{ (e.prenom[0] + e.nom[0]).toUpperCase() }}
                </div>
                <div>
                  <div class="fw-semibold">{{ e.prenom }} {{ e.nom }}</div>
                  <small class="text-muted">{{ e.sexe === 'F' ? '♀ Fille' : '♂ Garçon' }}</small>
                </div>
              </div>
            </td>
            <td class="small">{{ e.dateNaissance | date:'dd/MM/yyyy' }}</td>
            <td><span class="badge bg-success">{{ e.classe?.nom }}</span></td>
            <td class="small">
              <div>{{ e.nomPere || e.nomMere || '—' }}</div>
              <div class="text-muted">{{ e.telephoneParent || '' }}</div>
            </td>
            <td class="small">
              <span *ngIf="e.emailParent" class="text-success">
                <i class="bi bi-envelope-check me-1"></i>{{ e.emailParent }}
              </span>
              <span *ngIf="!e.emailParent" class="text-muted fst-italic">
                <i class="bi bi-envelope-x me-1"></i>Non renseigné
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-warning me-1" title="Facture proforma" (click)="openInvoice(e)">
                <i class="bi bi-receipt"></i>
              </button>
              <button class="btn btn-sm btn-outline-secondary me-1" title="CIN Scolaire" (click)="openCin(e)">
                <i class="bi bi-person-vcard"></i>
              </button>
              <button class="btn btn-sm btn-outline-primary me-1" (click)="openModal(e)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" (click)="deleteEleve(e)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredEleves.length===0">
            <td colspan="7" class="text-center text-muted py-5">
              <i class="bi bi-person-x fs-1 d-block mb-2 opacity-25"></i>
              Aucun élève trouvé
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- ═══ MODAL AJOUT / MODIFICATION ════════════════════════════════════════ -->
<div class="modal fade show d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5);">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header text-white" style="background:#1a6b3c;">
        <h5 class="modal-title">
          <i class="bi bi-person-plus me-2"></i>
          {{ editEleve?.id ? 'Modifier' : 'Inscrire' }} un élève
        </h5>
        <button class="btn-close btn-close-white" (click)="showModal=false"></button>
      </div>
      <div class="modal-body">
        <div class="row g-3">
          <!-- Infos élève -->
          <div class="col-12"><h6 class="fw-bold text-success border-bottom pb-1">Informations de l'élève</h6></div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Prénom *</label>
            <input class="form-control" [(ngModel)]="editEleve!.prenom" placeholder="Prénom">
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Nom *</label>
            <input class="form-control" [(ngModel)]="editEleve!.nom" placeholder="Nom de famille">
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Sexe</label>
            <select class="form-select" [(ngModel)]="editEleve!.sexe">
              <option value="M">♂ Masculin</option>
              <option value="F">♀ Féminin</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Date de naissance</label>
            <input type="date" class="form-control" [(ngModel)]="editEleve!.dateNaissance">
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Lieu de naissance</label>
            <input class="form-control" [(ngModel)]="editEleve!.lieuNaissance" placeholder="Ville">
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Adresse</label>
            <input class="form-control" [(ngModel)]="editEleve!.adresse" placeholder="Quartier, Ville">
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Classe *</label>
            <select class="form-select" [(ngModel)]="editEleve!.classeId">
              <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Année scolaire</label>
            <input class="form-control" [(ngModel)]="editEleve!.anneeScol" placeholder="2023-2024">
          </div>

          <!-- Infos parents -->
          <div class="col-12 mt-2">
            <h6 class="fw-bold text-success border-bottom pb-1">
              Informations du parent / tuteur
              <small class="text-muted fw-normal">(pour les notifications par email)</small>
            </h6>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Nom du père</label>
            <input class="form-control" [(ngModel)]="editEleve!.nomPere" placeholder="Prénom Nom">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Nom de la mère</label>
            <input class="form-control" [(ngModel)]="editEleve!.nomMere" placeholder="Prénom Nom">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Téléphone parent</label>
            <input class="form-control" [(ngModel)]="editEleve!.telephoneParent" placeholder="77 XXX XX XX">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">
              📧 Email parent
              <span class="badge bg-warning text-dark ms-1" style="font-size:.7rem;">Notifications</span>
            </label>
            <input type="email" class="form-control" [(ngModel)]="editEleve!.emailParent"
                   placeholder="parent@exemple.com">
            <small class="text-muted">
              Les bulletins et rappels de paiement seront envoyés à cet email
            </small>
          </div>

          <!-- École d'origine (optionnel) -->
          <div class="col-12 mt-2">
            <h6 class="fw-bold text-success border-bottom pb-1">
              École d'origine <small class="text-muted fw-normal">(optionnel — élève venant d'un autre établissement)</small>
            </h6>
          </div>
          <div class="col-12 form-check">
            <input type="checkbox" class="form-check-input" id="hasEcoleOrigine" [(ngModel)]="hasEcoleOrigine" [ngModelOptions]="{standalone:true}">
            <label class="form-check-label" for="hasEcoleOrigine">L'élève vient d'une autre école</label>
          </div>
          <ng-container *ngIf="hasEcoleOrigine">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Nom de l'école d'origine</label>
              <input class="form-control" [(ngModel)]="editEleve!.ecoleOrigine" placeholder="Nom de l'école">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Classe de l'année passée</label>
              <input class="form-control" [(ngModel)]="editEleve!.classeAnneePrecedente" placeholder="Ex: CE1">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Notes — 1er semestre</label>
              <textarea class="form-control" rows="2" [(ngModel)]="editEleve!.notesOrigineS1" placeholder="Résumé des notes du 1er semestre"></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Notes — 2e semestre</label>
              <textarea class="form-control" rows="2" [(ngModel)]="editEleve!.notesOrigineS2" placeholder="Résumé des notes du 2e semestre"></textarea>
            </div>
          </ng-container>

          <div class="col-md-4">
            <label class="form-label fw-semibold">Montant inscription</label>
            <input type="number" min="0" class="form-control" [(ngModel)]="editEleve!.montantInscription" placeholder="0">
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Montant mensuel</label>
            <input type="number" min="0" class="form-control" [(ngModel)]="editEleve!.montantMensuel" placeholder="0">
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Somme versée en juillet</label>
            <input type="number" min="0" class="form-control" [(ngModel)]="editEleve!.sommeVerseJuillet" placeholder="0">
          </div>
          <div class="col-12 mt-2" *ngIf="!editEleve?.id">
            <h6 class="fw-bold text-success border-bottom pb-1">Paiement à l'inscription</h6>
          </div>
          <div class="col-md-4" *ngIf="!editEleve?.id">
            <label class="form-label fw-semibold">Montant payé inscription</label>
            <input type="number" min="0" class="form-control" [(ngModel)]="montantPayeInscription" placeholder="0">
          </div>
          <div class="col-md-4" *ngIf="!editEleve?.id">
            <label class="form-label fw-semibold">Montant payé octobre</label>
            <input type="number" min="0" class="form-control" [(ngModel)]="montantPayeOctobre" placeholder="0">
          </div>
          <div class="col-md-4 d-flex align-items-end pb-2" *ngIf="!editEleve?.id">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="anneeCompletePayee" [(ngModel)]="anneeCompletePayee" [ngModelOptions]="{standalone:true}">
              <label class="form-check-label fw-semibold" for="anneeCompletePayee">Année complète payée</label>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="showModal=false">Annuler</button>
        <button class="btn btn-success px-4" (click)="saveEleve()" [disabled]="saving">
          <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
          <i *ngIf="!saving" class="bi bi-check2 me-1"></i>
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ═══ MODAL IMPORT EXCEL ═════════════════════════════════════════════════ -->
<div class="modal fade show d-block" *ngIf="showImport" style="background:rgba(0,0,0,0.5);">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header text-white" style="background:#1a6b3c;">
        <h5 class="modal-title"><i class="bi bi-cloud-upload me-2"></i>Importer des élèves (Excel)</h5>
        <button class="btn-close btn-close-white" (click)="showImport=false"></button>
      </div>
      <div class="modal-body">
        <div class="alert alert-info small">
          <strong>Format attendu (colonnes Excel) :</strong><br>
          A=Prénom · B=Nom · C=DateNaissance (YYYY-MM-DD) · D=LieuNaissance · E=Sexe(M/F)
          · F=NomPere · G=NomMere · H=Téléphone · I=Adresse · <strong>J=EmailParent</strong>
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold">Classe *</label>
            <select class="form-select" [(ngModel)]="importClasseId">
              <option value="">Sélectionner une classe</option>
              <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }}</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Année scolaire</label>
            <input class="form-control" [(ngModel)]="importAnnee" placeholder="2023-2024">
          </div>
          <div class="col-12">
            <label class="form-label fw-semibold">Fichier Excel (.xlsx)</label>
            <input type="file" class="form-control" accept=".xlsx,.xls" (change)="onFileSelected($event)">
          </div>
        </div>
        <div *ngIf="importResult" class="alert mt-3"
             [class.alert-success]="!importResult.errors?.length"
             [class.alert-warning]="importResult.errors?.length">
          <strong>{{ importResult.created }} élève(s) importé(s)</strong>
          <ul *ngIf="importResult.errors?.length" class="mb-0 mt-1 small">
            <li *ngFor="let e of importResult.errors">{{ e }}</li>
          </ul>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="showImport=false">Fermer</button>
        <button class="btn btn-success" (click)="importEleves()"
                [disabled]="!importFile || !importClasseId || saving">
          <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
          Importer
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ═══ MODAL FACTURE PROFORMA (imprimable) ═══════════════════════════════════ -->
<div class="modal fade show d-block print-modal" *ngIf="invoiceEleve" style="background:rgba(0,0,0,0.7);">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header no-print" style="background:#f4b942; color:#111;">
        <h5 class="modal-title"><i class="bi bi-receipt me-2"></i>Facture proforma</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-dark btn-sm" type="button" (click)="printCurrentModal()"><i class="bi bi-printer me-1"></i>Imprimer</button>
          <button class="btn-close" type="button" (click)="invoiceEleve = null"></button>
        </div>
      </div>
      <div class="modal-body p-4">
        <div class="text-center mb-3">
          <h4 class="fw-bold mb-0">INSTITUT ANNOUR</h4>
          <div class="text-muted small">IEF/IA de Diourbel</div>
          <div class="fw-bold text-decoration-underline mt-2">FACTURE PROFORMA</div>
        </div>
        <div class="row small mb-3">
          <div class="col-md-6"><strong>Élève :</strong> {{ invoiceEleve.prenom }} {{ invoiceEleve.nom }}</div>
          <div class="col-md-6 text-md-end"><strong>Classe :</strong> {{ invoiceEleve.classe?.nom || '—' }}</div>
          <div class="col-md-6"><strong>Matricule :</strong> {{ invoiceEleve.matricule || '—' }}</div>
          <div class="col-md-6 text-md-end"><strong>Année :</strong> {{ invoiceEleve.anneeScol }}</div>
        </div>

        <table class="table table-bordered table-sm mb-3">
          <thead class="table-light">
            <tr><th>Mois</th><th>Montant</th><th>Versement juillet</th><th>Solde</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of getFactureRows(invoiceEleve)">
              <td>{{ row.mois }}</td>
              <td>{{ row.montant | number:'1.0-0' }} FCFA</td>
              <td>{{ row.versement | number:'1.0-0' }} FCFA</td>
              <td>{{ row.solde | number:'1.0-0' }} FCFA</td>
            </tr>
            <tr>
              <td class="fw-bold">Inscription</td>
              <td>{{ getInscriptionPayment().montantDu | number:'1.0-0' }} FCFA</td>
              <td>{{ getInscriptionPayment().montantPaye | number:'1.0-0' }} FCFA</td>
              <td>{{ getInscriptionPayment().montantRestant | number:'1.0-0' }} FCFA</td>
            </tr>
          </tbody>
        </table>

        <div class="d-flex justify-content-between fw-bold border-top pt-3">
          <span>Total à payer</span>
          <span>{{ getTotalFacture(invoiceEleve) | number:'1.0-0' }} FCFA</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ MODAL CIN SCOLAIRE (imprimable) ═══════════════════════════════════ -->
<div class="modal fade show d-block print-modal" *ngIf="cinEleve" style="background:rgba(0,0,0,0.7);">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header no-print">
        <h5 class="modal-title">CIN Scolaire</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-success btn-sm" type="button" (click)="printCurrentModal()"><i class="bi bi-printer me-1"></i>Imprimer</button>
          <button class="btn-close" (click)="cinEleve = null"></button>
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
               [style.background]="cinEleve.sexe==='F' ? '#e91e63' : '#1a6b3c'">
            {{ ((cinEleve.prenom || 'A')[0] + (cinEleve.nom || 'A')[0]).toUpperCase() }}
          </div>
          <div class="small flex-grow-1">
            <div><strong>Matricule :</strong> {{ cinEleve.matricule }}</div>
            <div><strong>Nom :</strong> {{ cinEleve.nom }}</div>
            <div><strong>Prénom :</strong> {{ cinEleve.prenom }}</div>
            <div><strong>Né(e) le :</strong> {{ cinEleve.dateNaissance | date:'dd/MM/yyyy' }} à {{ cinEleve.lieuNaissance || '—' }}</div>
            <div><strong>Sexe :</strong> {{ cinEleve.sexe === 'F' ? 'Féminin' : 'Masculin' }}</div>
            <div><strong>Classe :</strong> {{ cinEleve.classe?.nom }}</div>
            <div><strong>Année scolaire :</strong> {{ cinEleve.anneeScol }}</div>
          </div>
        </div>
        <div class="small mt-3">
          <div class="fw-semibold border-bottom pb-1 mb-1">Informations de l'inscription</div>
          <div><strong>Nom du père :</strong> {{ cinEleve.nomPere || '—' }}</div>
          <div><strong>Nom de la mère :</strong> {{ cinEleve.nomMere || '—' }}</div>
          <div><strong>Téléphone parent :</strong> {{ cinEleve.telephoneParent || '—' }}</div>
          <div><strong>Adresse :</strong> {{ cinEleve.adresse || '—' }}</div>
          <ng-container *ngIf="cinEleve.ecoleOrigine">
            <div><strong>École d'origine :</strong> {{ cinEleve.ecoleOrigine }}</div>
            <div><strong>Classe année précédente :</strong> {{ cinEleve.classeAnneePrecedente || '—' }}</div>
          </ng-container>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  body.print-mode > *:not(.print-modal) { display: none !important; }
  body.print-mode .print-modal { display: block !important; position: static !important; background: transparent !important; }
  body.print-mode .print-modal .modal-dialog { max-width: 100% !important; width: 100% !important; margin: 0 !important; }
  body.print-mode .print-modal .modal-content { border: none !important; box-shadow: none !important; }
  body.print-mode .no-print { display: none !important; }
  @media print {
    .no-print { display: none !important; }
    .modal-dialog { max-width: 100% !important; margin: 0 !important; }
    .modal-content { border: none !important; box-shadow: none !important; }
  }
</style>
  `,
})
export class StudentsComponent implements OnInit {
  eleves: Eleve[] = [];
  classes: Classe[] = [];
  selectedClasse = '';
  searchText = '';
  filtreSexe = '';
  showModal = false;
  showImport = false;
  editEleve: Eleve | null = null;
  saving = false;
  importFile: File | null = null;
  importClasseId = '';
  importAnnee = '2023-2024';
  importResult: any = null;
  hasEcoleOrigine = false;
  cinEleve: Eleve | null = null;
  invoiceEleve: Eleve | null = null;
  invoicePaiements: any[] = [];
  montantPayeInscription = 0;
  montantPayeOctobre = 0;
  anneeCompletePayee = false;

  get filteredEleves(): Eleve[] {
    return this.eleves.filter(e => {
      const matchSearch = !this.searchText ||
        `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(this.searchText.toLowerCase());
      const matchSexe = !this.filtreSexe || e.sexe === this.filtreSexe;
      return matchSearch && matchSexe;
    });
  }

  get emailCount(): number {
    return this.filteredEleves.filter(e => e.emailParent).length;
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getClasses().subscribe(c => this.classes = c);
    this.loadEleves();
  }

  loadEleves() {
    const classeId = this.selectedClasse ? +this.selectedClasse : undefined;
    this.api.getEleves(classeId).subscribe(e => this.eleves = e);
  }

  openModal(eleve?: Eleve) {
    this.editEleve = eleve
      ? { ...eleve, classeId: eleve.classe?.id }
      : { prenom: '', nom: '', sexe: 'M', anneeScol: '2023-2024', classeId: undefined as any } as Eleve;
    this.montantPayeInscription = 0;
    this.montantPayeOctobre = 0;
    this.anneeCompletePayee = false;
    this.hasEcoleOrigine = !!this.editEleve.ecoleOrigine;
    this.showModal = true;
  }

  openCin(e: Eleve) { this.cinEleve = e; this.invoiceEleve = null; }
  openInvoice(e: Eleve) {
    this.invoiceEleve = e;
    this.invoicePaiements = [];
    this.cinEleve = null;
    if (e.id) this.api.getPaiements({ eleveId: e.id, anneeScol: e.anneeScol }).subscribe(p => this.invoicePaiements = p);
  }

  getFactureRows(eleve?: Eleve | null): Array<{ mois: string; montant: number; versement: number; solde: number }> {
    const target = eleve || this.invoiceEleve;
    if (!target) return [];
    const months = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet'];
    const montantMensuel = Number(target.montantMensuel ?? 0);
    const verseJuillet = Number(target.sommeVerseJuillet ?? 0);
    const paymentTypes = ['OCTOBRE', 'NOVEMBRE', 'DECEMBRE', 'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET'];
    return months.map((mois, index) => {
      const payment = this.invoicePaiements.find(p => p.typePaiement === `SCOLARITE_${paymentTypes[index]}`);
      const montant = payment ? Number(payment.montantDu ?? montantMensuel) : montantMensuel;
      const versement = payment ? Number(payment.montantPaye ?? 0) : (index === 9 ? verseJuillet : 0);
      return {
      mois,
      montant,
      versement,
      solde: Math.max(montant - versement, 0)
      };
    });
  }

  getMontantInscription(eleve?: Eleve | null): number {
    return Number((eleve || this.invoiceEleve)?.montantInscription ?? 0);
  }

  getInscriptionPayment(): { montantDu: number; montantPaye: number; montantRestant: number } {
    const payment = this.invoicePaiements.find(p => p.typePaiement === 'INSCRIPTION');
    if (payment) {
      return {
        montantDu: Number(payment.montantDu ?? 0),
        montantPaye: Number(payment.montantPaye ?? 0),
        montantRestant: Number(payment.montantRestant ?? 0)
      };
    }
    const amount = this.getMontantInscription();
    return { montantDu: amount, montantPaye: 0, montantRestant: amount };
  }

  getTotalFacture(eleve?: Eleve | null): number {
    const target = eleve || this.invoiceEleve;
    if (!target) return 0;
    if (this.invoicePaiements.length) {
      return this.invoicePaiements.reduce((total, payment) => total + Number(payment.montantDu ?? 0), 0);
    }
    return this.getMontantInscription(target) + (Number(target.montantMensuel ?? 0) * 10) - Number(target.sommeVerseJuillet ?? 0);
  }

  printCurrentModal() {
    document.body.classList.add('print-mode');
    setTimeout(() => window.print(), 250);
    setTimeout(() => document.body.classList.remove('print-mode'), 1000);
  }

  saveEleve() {
    if (!this.editEleve) return;
    this.saving = true;
    const eleve = { ...this.editEleve, classe: { id: this.editEleve.classeId } };
    const payload = this.editEleve.id ? eleve : {
      eleve,
      montantPayeInscription: this.montantPayeInscription,
      montantPayeOctobre: this.montantPayeOctobre,
      anneeCompletePayee: this.anneeCompletePayee
    };
    const obs = this.editEleve.id
      ? this.api.updateEleve(this.editEleve.id, payload)
      : this.api.createEleve(payload);
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.loadEleves(); },
      error: () => this.saving = false
    });
  }

  deleteEleve(e: Eleve) {
    if (!e.id || !confirm(`Supprimer ${e.prenom} ${e.nom} ?`)) return;
    this.api.deleteEleve(e.id).subscribe(() => this.loadEleves());
  }

  onFileSelected(event: any) { this.importFile = event.target.files[0]; }

  importEleves() {
    if (!this.importFile || !this.importClasseId) return;
    this.saving = true;
    this.api.importEleves(this.importFile, +this.importClasseId, this.importAnnee).subscribe({
      next: (res) => { this.importResult = res; this.saving = false; this.loadEleves(); },
      error: () => this.saving = false
    });
  }
}
