import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
<div class="d-flex" style="min-height:100vh;">

  <!-- Sidebar -->
  <nav class="d-flex flex-column text-white"
       style="width:260px; min-height:100vh; background:linear-gradient(180deg, #1a6b3c 0%, #0d4a2a 100%); flex-shrink:0;">

    <!-- Logo -->
    <div class="p-3 border-bottom border-success-subtle">
      <div class="d-flex align-items-center gap-2">
        <div class="rounded-circle d-flex align-items-center justify-content-center bg-white"
             style="width:42px; height:42px; flex-shrink:0;">
          <i class="bi bi-mortarboard-fill text-success fw-bold fs-5"></i>
        </div>
        <div>
          <div class="fw-bold" style="font-size:.92rem;">ASMTIC</div>
          <div class="opacity-75" style="font-size:.7rem;">Darou • {{ anneeScolaire }}</div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="p-2 flex-grow-1 overflow-auto">

      <ng-container *ngIf="!auth.isParent()">
      <!-- Administration -->
      <div class="section-label">Administration</div>
      <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
        <i class="bi bi-speedometer2"></i> Tableau de bord
      </a>
      <a routerLink="/classes" routerLinkActive="active" class="nav-item">
        <i class="bi bi-building"></i> Gestion des Classes
      </a>
      <a routerLink="/enseignants" routerLinkActive="active" class="nav-item">
        <i class="bi bi-person-badge-fill"></i> Personnel
      </a>

      <!-- Pédagogie -->
      <div class="section-label mt-2">Pédagogie</div>
      <a routerLink="/eleves" routerLinkActive="active" class="nav-item">
        <i class="bi bi-people-fill"></i> Élèves
      </a>
      <a routerLink="/notes" routerLinkActive="active" class="nav-item">
        <i class="bi bi-pencil-square"></i> Saisie des Notes
      </a>
      <a routerLink="/bulletins" routerLinkActive="active" class="nav-item">
        <i class="bi bi-file-text-fill"></i> Bulletins
      </a>

      <!-- Présences & Finances -->
      <div class="section-label mt-2">Présences & Finances</div>
      <a routerLink="/pointage" routerLinkActive="active" class="nav-item">
        <i class="bi bi-calendar-check-fill"></i> Pointage
      </a>
      <a routerLink="/paiements" routerLinkActive="active" class="nav-item">
        <i class="bi bi-cash-coin"></i> Paiements
      </a>
      <a routerLink="/salaires" routerLinkActive="active" class="nav-item">
        <i class="bi bi-wallet2"></i> Salaires
      </a>

      <!-- Communication -->
      <div class="section-label mt-2">Communication</div>
      <a routerLink="/notifications" routerLinkActive="active" class="nav-item">
        <i class="bi bi-envelope-fill"></i> Notifications Parents
      </a>
      </ng-container>
      <a *ngIf="auth.isParent()" routerLink="/portail-parent" routerLinkActive="active" class="nav-item">
        <i class="bi bi-house-heart-fill"></i> Portail parent
      </a>
    </div>

    <!-- Utilisateur connecté -->
    <div class="p-3 border-top border-success-subtle">
      <div class="d-flex align-items-center gap-2">
        <div class="rounded-circle bg-white d-flex align-items-center justify-content-center"
             style="width:35px; height:35px; flex-shrink:0;">
          <i class="bi bi-person-fill text-success"></i>
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <div class="fw-semibold text-truncate" style="font-size:.85rem;">{{ username }}</div>
          <div class="opacity-75" style="font-size:.7rem;">{{ roleLabel }}</div>
        </div>
        <button class="btn btn-sm btn-outline-light" (click)="logout()" title="Déconnexion">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </div>
  </nav>

  <!-- Contenu -->
  <div class="flex-grow-1 overflow-auto bg-light">
    <router-outlet></router-outlet>
  </div>
</div>

<style>
  .section-label {
    text-transform: uppercase; opacity: .5; padding: 6px 12px 4px;
    font-size: .62rem; letter-spacing: 1.2px; font-weight: 600;
  }
  .nav-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 6px; margin-bottom: 2px;
    color: white; text-decoration: none; font-size: .88rem;
    transition: background .15s;
  }
  .nav-item:hover { background: rgba(255,255,255,.12) !important; color: white; }
  .nav-item.active { background: rgba(255,255,255,.22) !important; font-weight: 600; color: white; }
</style>
  `,
})
export class LayoutComponent {
  username = '';
  roleLabel = '';
  anneeScolaire = this.getCurrentSchoolYear();

  private roleLabels: Record<string, string> = {
    ADMIN: '🔐 Administrateur', DIRECTEUR: '🏫 Directeur',
    ENSEIGNANT: '📚 Enseignant', SURVEILLANT: '👁️ Surveillant',
    SECRETAIRE: '📋 Secrétaire'
  };

  constructor(public auth: AuthService) {
    this.auth.currentUser$.subscribe(u => {
      if (u) {
        this.username = u.username;
        const r = u.role.replace('ROLE_', '');
        this.roleLabel = this.roleLabels[r] || r;
      }
    });
  }

  logout() { this.auth.logout(); }

  private getCurrentSchoolYear(): string {
    const today = new Date();
    const startYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    return `${startYear}-${startYear + 1}`;
  }
}
