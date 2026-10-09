import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center" 
         style="background: linear-gradient(135deg, #1a6b3c 0%, #2d9e5f 50%, #0d4a2a 100%);">
      <div class="card shadow-lg" style="width: 420px; border-radius: 16px; overflow: hidden;">
        <div class="card-header text-white text-center py-4" 
             style="background: linear-gradient(135deg, #1a6b3c, #0d4a2a);">
          <div class="mb-2">
            <i class="bi bi-building-fill" style="font-size: 2.5rem;"></i>
          </div>
          <h4 class="mb-1 fw-bold">ASMTIC</h4>
          <p class="mb-0 opacity-75 small">Système de Gestion Scolaire</p>
          <p class="mb-0 opacity-75 small">Darou</p>
        </div>
        <div class="card-body p-4">
          <div *ngIf="error" class="alert alert-danger alert-sm py-2 small">
            <i class="bi bi-exclamation-triangle me-1"></i>{{ error }}
          </div>
          <form (ngSubmit)="login()">
            <div class="btn-group w-100 mb-4" role="group">
              <button type="button" class="btn" [class.btn-success]="!parentMode" [class.btn-outline-success]="parentMode" (click)="parentMode = false">Personnel</button>
              <button type="button" class="btn" [class.btn-success]="parentMode" [class.btn-outline-success]="!parentMode" (click)="parentMode = true">Espace parent</button>
            </div>
            <div class="mb-3" *ngIf="!parentMode">
              <label class="form-label fw-semibold">
                <i class="bi bi-person me-1"></i>Identifiant
              </label>
              <input type="text" class="form-control" [(ngModel)]="username" name="username" 
                     placeholder="Nom d'utilisateur" required autofocus>
            </div>
            <div class="mb-3" *ngIf="parentMode">
              <label class="form-label fw-semibold"><i class="bi bi-card-text me-1"></i>Matricule de l'élève</label>
              <input type="text" class="form-control" [(ngModel)]="matricule" name="matricule" placeholder="Ex. SN10000" required>
            </div>
            <div class="mb-4" *ngIf="!parentMode">
              <label class="form-label fw-semibold">
                <i class="bi bi-lock me-1"></i>Mot de passe
              </label>
              <div class="input-group">
                <input [type]="showPwd ? 'text' : 'password'" class="form-control" 
                       [(ngModel)]="password" name="password" placeholder="••••••••" required>
                <button type="button" class="btn btn-outline-secondary" (click)="showPwd = !showPwd">
                  <i class="bi" [class.bi-eye]="!showPwd" [class.bi-eye-slash]="showPwd"></i>
                </button>
              </div>
            </div>
            <div class="mb-4" *ngIf="parentMode">
              <label class="form-label fw-semibold"><i class="bi bi-telephone me-1"></i>Téléphone du parent</label>
              <input type="tel" class="form-control" [(ngModel)]="telephoneParent" name="telephoneParent" placeholder="77 400 00 00" required>
            </div>
            <button type="submit" class="btn btn-success w-100 fw-semibold py-2" 
                    [disabled]="loading" style="background: #1a6b3c; border-color: #1a6b3c;">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i *ngIf="!loading" class="bi bi-box-arrow-in-right me-1"></i>
              {{ loading ? 'Connexion...' : (parentMode ? 'Accéder au portail' : 'Se connecter') }}
            </button>
          </form>
        </div>
        <div class="card-footer text-center text-muted small py-3 bg-light">
          Année Scolaire {{ anneeScolaire }} — Ministère de l'Éducation Nationale
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  matricule = '';
  telephoneParent = '';
  parentMode = false;
  anneeScolaire = this.getCurrentSchoolYear();
  error = '';
  loading = false;
  showPwd = false;

  constructor(private auth: AuthService, private router: Router) {
    if (auth.isLoggedIn()) router.navigate([auth.isParent() ? '/portail-parent' : '/']);
  }

  login() {
    this.error = '';
    this.loading = true;
    const request = this.parentMode
      ? this.auth.parentLogin(this.matricule, this.telephoneParent)
      : this.auth.login(this.username, this.password);
    request.subscribe({
      next: () => this.router.navigate([this.parentMode ? '/portail-parent' : '/']),
      error: (e) => {
        this.error = 'Identifiant ou mot de passe incorrect';
        this.loading = false;
      }
    });
  }

  private getCurrentSchoolYear(): string {
    const today = new Date();
    const startYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    return `${startYear}-${startYear + 1}`;
  }
}
