import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User, Classe, UserRole } from '../../models/models';

interface RoleInfo { label: string; color: string; icon: string; }

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4">

  <!-- Header -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h3 class="fw-bold mb-1">👤 Gestion du Personnel</h3>
      <p class="text-muted mb-0">Enseignants, surveillants, secrétaires et administrateurs</p>
    </div>
    <button class="btn btn-success px-4" (click)="openModal()">
      <i class="bi bi-person-plus me-2"></i>Nouveau membre
    </button>
  </div>

  <!-- Filtre par rôle -->
  <div class="d-flex gap-2 flex-wrap mb-4">
    <button class="btn btn-sm" [class.btn-dark]="filtreRole===''" [class.btn-outline-secondary]="filtreRole!=''"
            (click)="filtreRole=''">Tous ({{ users.length }})</button>
    <button *ngFor="let r of rolesDisponibles" class="btn btn-sm"
            [style.background]="filtreRole===r ? getRoleInfo(r).color : ''"
            [style.color]="filtreRole===r ? 'white' : ''"
            [class.btn-outline-secondary]="filtreRole!==r"
            (click)="filtreRole = filtreRole===r ? '' : r">
      {{ getRoleInfo(r).icon }} {{ getRoleInfo(r).label }}
      ({{ countRole(r) }})
    </button>
  </div>

  <!-- Cartes utilisateurs -->
  <div class="row g-3">
    <div class="col-md-4 col-lg-3" *ngFor="let u of filteredUsers">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <!-- Avatar + Nom -->
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-5"
                 style="width:52px; height:52px; flex-shrink:0;"
                 [style.background]="getRoleInfo(u.role).color">
              {{ getInitials(u) }}
            </div>
            <div class="overflow-hidden">
              <div class="fw-bold text-truncate">{{ u.prenom }} {{ u.nom }}</div>
              <span class="badge" [style.background]="getRoleInfo(u.role).color" style="font-size:.7rem;">
                {{ getRoleInfo(u.role).icon }} {{ getRoleInfo(u.role).label }}
              </span>
            </div>
          </div>
          <!-- Infos -->
          <div class="small text-muted vstack gap-1">
            <div><i class="bi bi-person me-1"></i>{{ u.username }}</div>
            <div *ngIf="u.email"><i class="bi bi-envelope me-1"></i>{{ u.email }}</div>
            <div *ngIf="u.telephone"><i class="bi bi-telephone me-1"></i>{{ u.telephone }}</div>
            <div *ngIf="u.classe" class="text-success fw-semibold">
              <i class="bi bi-building me-1"></i>{{ u.classe.nom }}
            </div>
          </div>
          <!-- Actions -->
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-sm btn-outline-primary flex-grow-1" (click)="openModal(u)">
              <i class="bi bi-pencil me-1"></i>Modifier
            </button>
            <button class="btn btn-sm btn-outline-danger" (click)="deleteUser(u)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="col-12 text-center text-muted py-5" *ngIf="filteredUsers.length === 0">
      <i class="bi bi-person-x fs-1 d-block mb-2 opacity-25"></i>
      Aucun membre du personnel trouvé
    </div>
  </div>
</div>

<!-- ═══ MODAL AJOUT / MODIFICATION ═══════════════════════════════════════ -->
<div class="modal fade show d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5);">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header text-white" style="background:#1a6b3c;">
        <h5 class="modal-title">
          <i class="bi bi-person-plus me-2"></i>
          {{ editUser?.id ? 'Modifier' : 'Ajouter' }} un membre du personnel
        </h5>
        <button class="btn-close btn-close-white" (click)="showModal=false"></button>
      </div>

      <div class="modal-body">
        <!-- Sélecteur de rôle visuel -->
        <div class="mb-4">
          <label class="form-label fw-semibold">Rôle *</label>
          <div class="d-flex flex-wrap gap-2">
            <button *ngFor="let r of rolesDisponibles" type="button"
                    class="btn btn-sm d-flex align-items-center gap-1"
                    [style.background]="form.role===r ? getRoleInfo(r).color : '#f8f9fa'"
                    [style.color]="form.role===r ? 'white' : '#495057'"
                    [style.border]="form.role===r ? '2px solid ' + getRoleInfo(r).color : '2px solid #dee2e6'"
                    (click)="form.role=r; onRoleChange()">
              <span>{{ getRoleInfo(r).icon }}</span>
              <span>{{ getRoleInfo(r).label }}</span>
            </button>
          </div>
          <small class="text-muted mt-1 d-block">{{ getRoleDescription(form.role) }}</small>
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold">Prénom *</label>
            <input class="form-control" [(ngModel)]="form.prenom" placeholder="Prénom">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Nom *</label>
            <input class="form-control" [(ngModel)]="form.nom" placeholder="Nom de famille">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Identifiant (login) *</label>
            <input class="form-control" [(ngModel)]="form.username"
                   [disabled]="!!editUser?.id" placeholder="ex: fatou.sene">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">
              Mot de passe {{ editUser?.id ? '(vide = inchangé)' : '*' }}
            </label>
            <input type="password" class="form-control" [(ngModel)]="form.password"
                   [placeholder]="editUser?.id ? '••••••' : 'Minimum 6 caractères'">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Email</label>
            <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="email@exemple.com">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Téléphone</label>
            <input class="form-control" [(ngModel)]="form.telephone" placeholder="77 XXX XX XX">
          </div>
          <!-- Classe : uniquement pour ENSEIGNANT et SURVEILLANT -->
          <div class="col-12" *ngIf="form.role === 'ENSEIGNANT' || form.role === 'SURVEILLANT'">
            <label class="form-label fw-semibold">
              Classe assignée
              <span class="text-muted fw-normal">(optionnel)</span>
            </label>
            <select class="form-select" [(ngModel)]="form.classeId">
              <option value="">— Sans classe spécifique —</option>
              <option *ngFor="let c of classes" [value]="c.id">{{ c.nom }} ({{ c.effectifs || 0 }} élèves)</option>
            </select>
          </div>
        </div>

        <!-- Résumé du compte à créer -->
        <div class="alert alert-light border mt-3 mb-0" *ngIf="!editUser?.id">
          <small>
            <strong>Compte :</strong> {{ form.username || '...' }} •
            <strong>Accès :</strong> {{ getRoleDescription(form.role) }}
          </small>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="showModal=false">Annuler</button>
        <button class="btn btn-success px-4" (click)="saveUser()" [disabled]="saving || !isFormValid()">
          <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
          <i *ngIf="!saving" class="bi bi-check2 me-1"></i>
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</div>
  `,
})
export class TeachersComponent implements OnInit {
  users: User[] = [];
  classes: Classe[] = [];
  showModal = false;
  editUser: User | null = null;
  saving = false;
  filtreRole = '';
  form: any = {};

  rolesDisponibles: UserRole[] = ['ADMIN', 'DIRECTEUR', 'ENSEIGNANT', 'SURVEILLANT', 'SECRETAIRE'];

  private roleInfoMap: Record<UserRole, RoleInfo> = {
    ADMIN:       { label: 'Administrateur', color: '#dc3545', icon: '🔐' },
    DIRECTEUR:   { label: 'Directeur',       color: '#0d6efd', icon: '🏫' },
    ENSEIGNANT:  { label: 'Enseignant',      color: '#1a6b3c', icon: '📚' },
    SURVEILLANT: { label: 'Surveillant',     color: '#fd7e14', icon: '👁️' },
    SECRETAIRE:  { label: 'Secrétaire',      color: '#6f42c1', icon: '📋' },
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getClasses().subscribe(c => this.classes = c);
    this.loadUsers();
  }

  loadUsers() {
    this.api.getUsers().subscribe(u => this.users = u);
  }

  get filteredUsers(): User[] {
    if (!this.filtreRole) return this.users;
    return this.users.filter(u => u.role === this.filtreRole);
  }

  countRole(role: string) {
    return this.users.filter(u => u.role === role).length;
  }

  openModal(user?: User) {
    this.editUser = user || null;
    this.form = user ? {
      prenom: user.prenom, nom: user.nom, username: user.username,
      email: user.email || '', telephone: user.telephone || '',
      role: user.role, classeId: user.classe?.id || '', password: ''
    } : {
      prenom: '', nom: '', username: '', password: '',
      email: '', telephone: '', role: 'ENSEIGNANT', classeId: ''
    };
    this.showModal = true;
  }

  onRoleChange() {
    if (this.form.role !== 'ENSEIGNANT' && this.form.role !== 'SURVEILLANT') {
      this.form.classeId = '';
    }
  }

  isFormValid(): boolean {
    return !!(this.form.prenom && this.form.nom && this.form.username &&
      (this.editUser?.id || this.form.password));
  }

  saveUser() {
    if (!this.isFormValid()) return;
    this.saving = true;
    const payload = {
      ...this.form,
      classeId: this.form.classeId || null,
      password: this.form.password || undefined
    };
    const obs = this.editUser?.id
      ? this.api.updateUser(this.editUser.id, payload)
      : this.api.createUser(payload);
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.loadUsers(); },
      error: (err) => {
        this.saving = false;
        alert(err.error?.error || 'Erreur lors de la sauvegarde');
      }
    });
  }

  deleteUser(u: User) {
    if (!u.id || !confirm(`Désactiver ${u.prenom} ${u.nom} ?`)) return;
    this.api.deleteUser(u.id).subscribe(() => this.loadUsers());
  }

  getRoleInfo(role: string): RoleInfo {
    return this.roleInfoMap[role as UserRole] || { label: role, color: '#6c757d', icon: '👤' };
  }

  getRoleDescription(role: string): string {
    const d: Record<string, string> = {
      ADMIN:       'Accès complet à tous les modules',
      DIRECTEUR:   'Gestion pédagogique, validation bulletins, salaires',
      ENSEIGNANT:  'Saisie notes, pointage élèves de sa classe',
      SURVEILLANT: 'Pointage présences, suivi absences',
      SECRETAIRE:  'Gestion paiements, inscriptions, notifications parents'
    };
    return d[role] || '';
  }

  getInitials(u: User) {
    return ((u.prenom?.[0] || '') + (u.nom?.[0] || '')).toUpperCase();
  }
}
