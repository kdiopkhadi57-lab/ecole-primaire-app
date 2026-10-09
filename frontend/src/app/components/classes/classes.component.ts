import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Classe } from '../../models/models';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4">

  <!-- Header -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h3 class="fw-bold mb-1">🏫 Gestion des Classes</h3>
      <p class="text-muted mb-0">Créer et gérer les classes de l'établissement</p>
    </div>
    <button class="btn btn-success px-4" (click)="openModal()">
      <i class="bi bi-plus-circle me-2"></i>Nouvelle classe
    </button>
  </div>

  <!-- Aide nommage -->
  <div class="alert alert-info d-flex gap-3 align-items-start mb-4">
    <i class="bi bi-info-circle-fill fs-5 mt-1 flex-shrink-0"></i>
    <div>
      <strong>Exemples de noms de classes :</strong>
      <div class="mt-1 d-flex flex-wrap gap-2">
        <span class="badge bg-primary" *ngFor="let ex of exemples" (click)="nomForm=ex" style="cursor:pointer;">
          {{ ex }}
        </span>
      </div>
      <small class="text-muted d-block mt-1">Cliquez sur un exemple pour le copier dans le formulaire</small>
    </div>
  </div>

  <!-- Grille de classes -->
  <div class="row g-3">
    <div class="col-md-3 col-sm-4 col-6" *ngFor="let c of classes">
      <div class="card border-0 shadow-sm h-100 position-relative">
        <!-- Couleur niveau -->
        <div class="card-top-bar" [style.background]="getNiveauColor(c.nom)"></div>
        <div class="card-body pt-3">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="fs-4">{{ getNiveauIcon(c.nom) }}</span>
            <div>
              <h5 class="mb-0 fw-bold">{{ c.nom }}</h5>
              <small class="text-muted">{{ getNiveauLabel(c.nom) }}</small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-1 mb-3">
            <i class="bi bi-people-fill text-success"></i>
            <span class="fw-semibold">{{ c.effectifs || 0 }}</span>
            <span class="text-muted small">élève(s)</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary flex-grow-1" (click)="openModal(c)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" (click)="deleteClasse(c)"
                    [disabled]="(c.effectifs || 0) > 0" [title]="(c.effectifs||0)>0 ? 'Classe non vide' : 'Supprimer'">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-bottom-info" *ngIf="(c.effectifs||0) > 0">
          <small>{{ c.effectifs }} élève(s) inscrit(s)</small>
        </div>
      </div>
    </div>

    <div class="col-12 text-center text-muted py-5" *ngIf="classes.length === 0 && !loading">
      <i class="bi bi-building fs-1 d-block mb-2 opacity-25"></i>
      Aucune classe créée. Commencez par en ajouter une.
    </div>

    <!-- Skeleton loading -->
<ng-container *ngIf="loading">
  <div class="col-md-3 col-sm-4 col-6"
       *ngFor="let _ of [1,2,3,4]">
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="placeholder-glow">
          <div class="placeholder col-8 mb-2"
               style="height:24px;border-radius:4px;"></div>
          <div class="placeholder col-4"
               style="height:16px;border-radius:4px;"></div>
        </div>
      </div>
    </div>
  </div>
</ng-container>
    </div>
  </div>


<!-- ═══ MODAL ═══════════════════════════════════════════════════════════ -->
<div class="modal fade show d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5);">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header text-white" style="background:#1a6b3c;">
        <h5 class="modal-title">
          <i class="bi bi-building me-2"></i>
          {{ editClasse?.id ? 'Modifier la classe' : 'Créer une nouvelle classe' }}
        </h5>
        <button class="btn-close btn-close-white" (click)="showModal=false"></button>
      </div>

      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label fw-semibold">Nom de la classe *</label>
          <input class="form-control form-control-lg" [(ngModel)]="nomForm"
                 placeholder="ex: 6emeA, 5emeB, CM2, CE1..."
                 [class.is-invalid]="errorMsg"
                 (input)="errorMsg=''">
          <div class="invalid-feedback" *ngIf="errorMsg">{{ errorMsg }}</div>
          <small class="text-muted">Entrez un nom libre : 6emeA, 5emeB, CM2, CE1, Terminale...</small>
        </div>

        <!-- Aperçu -->
        <div class="rounded p-3 text-center" [style.background]="getNiveauColor(nomForm)+'22'"
             [style.border]="'2px solid '+getNiveauColor(nomForm)"
             *ngIf="nomForm">
          <div class="fs-2">{{ getNiveauIcon(nomForm) }}</div>
          <div class="fw-bold fs-5">{{ nomForm }}</div>
          <small class="text-muted">{{ getNiveauLabel(nomForm) }}</small>
        </div>

        <!-- Suggestions rapides -->
        <div class="mt-3">
          <label class="form-label text-muted small">Suggestions rapides :</label>
          <div class="d-flex flex-wrap gap-1">
            <button type="button" class="btn btn-outline-secondary btn-sm"
                    *ngFor="let ex of exemples"
                    [class.btn-success]="nomForm===ex"
                    (click)="nomForm=ex; errorMsg=''">
              {{ ex }}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="showModal=false">Annuler</button>
        <button class="btn btn-success px-4" (click)="saveClasse()" [disabled]="saving || !nomForm.trim()">
          <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
          <i *ngIf="!saving" class="bi bi-check2 me-1"></i>
          {{ editClasse?.id ? 'Modifier' : 'Créer la classe' }}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .card-top-bar { height: 4px; border-radius: 8px 8px 0 0; }
  .card-bottom-info {
    background: #f8f9fa; border-top: 1px solid #e9ecef;
    padding: 6px 12px; font-size: .78rem; color: #6c757d;
    border-radius: 0 0 8px 8px; text-align: center;
  }
</style>
  `,
})
export class ClassesComponent implements OnInit {
  classes: Classe[] = [];
  showModal = false;
  editClasse: Classe | null = null;
  nomForm = '';
  errorMsg = '';
  saving = false;
  loading = false;

  exemples = ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6emeA', '6emeB', '5emeA', '5emeB',
               '4emeA', '3emeA', '2ndeA', '1ereA', 'TerminaleA'];

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadClasses(); }

  loadClasses() {
    this.loading = true;
    this.api.getClasses().subscribe({
      next: c => { this.classes = c.sort((a, b) => (a.nom || '').localeCompare(b.nom || '')); this.loading = false; },
      error: () => this.loading = false
    });
  }

  openModal(classe?: Classe) {
    this.editClasse = classe || null;
    this.nomForm = classe?.nom || '';
    this.errorMsg = '';
    this.showModal = true;
  }

  saveClasse() {
    if (!this.nomForm.trim()) return;
    this.saving = true;
    const obs = this.editClasse?.id
      ? this.api.updateClasse(this.editClasse.id, { nom: this.nomForm.trim() })
      : this.api.createClasse({ nom: this.nomForm.trim() });
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.loadClasses(); },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err.error?.error || 'Erreur lors de la sauvegarde';
      }
    });
  }

  deleteClasse(c: Classe) {
    if (!c.id || (c.effectifs || 0) > 0) return;
    if (!confirm(`Supprimer la classe "${c.nom}" ?`)) return;
    this.api.deleteClasse(c.id).subscribe({ next: () => this.loadClasses() });
  }

  getNiveauColor(nom?: string): string {
    if (!nom) return '#6c757d';
    const n = nom.toLowerCase();
    if (n.startsWith('ci') || n.startsWith('cp'))     return '#20c997';
    if (n.startsWith('ce'))                            return '#0d6efd';
    if (n.startsWith('cm'))                            return '#6f42c1';
    if (n.includes('6') || n.includes('5'))           return '#fd7e14';
    if (n.includes('4') || n.includes('3'))           return '#dc3545';
    if (n.includes('2nd') || n.includes('1') || n.includes('term')) return '#1a6b3c';
    return '#6c757d';
  }

  getNiveauIcon(nom?: string): string {
    if (!nom) return '🏫';
    const n = nom.toLowerCase();
    if (n.startsWith('ci') || n.startsWith('cp')) return '🌱';
    if (n.startsWith('ce'))                        return '📖';
    if (n.startsWith('cm'))                        return '✏️';
    if (n.includes('6') || n.includes('5'))       return '🎒';
    if (n.includes('4') || n.includes('3'))       return '📐';
    if (n.includes('2nd') || n.includes('1') || n.includes('term')) return '🎓';
    return '🏫';
  }

  getNiveauLabel(nom?: string): string {
    if (!nom) return '';
    const n = nom.toLowerCase();
    if (n.startsWith('ci'))   return 'Cours Initiation';
    if (n.startsWith('cp'))   return 'Cours Préparatoire';
    if (n.startsWith('ce1'))  return 'Cours Élém. 1ère année';
    if (n.startsWith('ce2'))  return 'Cours Élém. 2ème année';
    if (n.startsWith('cm1'))  return 'Cours Moyen 1ère année';
    if (n.startsWith('cm2'))  return 'Cours Moyen 2ème année';
    if (n.includes('6'))      return '6ème — Collège';
    if (n.includes('5'))      return '5ème — Collège';
    if (n.includes('4'))      return '4ème — Collège';
    if (n.includes('3'))      return '3ème — Collège';
    if (n.includes('2nd'))    return '2nde — Lycée';
    if (n.includes('1ere') || n.includes('1ère')) return '1ère — Lycée';
    if (n.includes('term'))   return 'Terminale — Lycée';
    return 'Classe personnalisée';
  }
}
