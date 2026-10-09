import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold mb-1 text-dark">Tableau de bord</h3>
          <p class="text-muted mb-0">ASMTIC — Darou</p>
        </div>
        <span class="badge bg-success fs-6 px-3">Année {{ anneeScolaire }}</span>
      </div>

      <!-- Stats cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #1a6b3c !important;">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">Total Élèves</div>
                  <div class="fs-2 fw-bold text-dark">{{ stats.totalEleves }}</div>
                </div>
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                     style="width: 50px; height: 50px; background: #e8f5e9;">
                  <i class="bi bi-people-fill text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #0d6efd !important;">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">Enseignants</div>
                  <div class="fs-2 fw-bold text-dark">{{ stats.totalEnseignants }}</div>
                </div>
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                     style="width: 50px; height: 50px; background: #e3f2fd;">
                  <i class="bi bi-person-badge-fill text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #fd7e14 !important;">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">Classes</div>
                  <div class="fs-2 fw-bold text-dark">{{ stats.totalClasses }}</div>
                </div>
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                     style="width: 50px; height: 50px; background: #fff3e0;">
                  <i class="bi bi-building text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #dc3545 !important;">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">Bulletins générés</div>
                  <div class="fs-2 fw-bold text-dark">{{ stats.totalBulletins }}</div>
                </div>
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                     style="width: 50px; height: 50px; background: #fce4ec;">
                  <i class="bi bi-file-text-fill text-danger fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 mt-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #20c997 !important;">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">Encaissements</div>
                  <div class="fs-5 fw-bold text-dark">{{ stats.totalEncaisse | number:'1.0-0' }} F</div>
                </div>
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                     style="width: 50px; height: 50px; background: #e0f8f1;">
                  <i class="bi bi-cash-coin text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 mt-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #fd7e14 !important;">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">Élèves avec impayés</div>
                  <div class="fs-2 fw-bold text-dark">{{ stats.nbImpayes }}</div>
                </div>
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                     style="width: 50px; height: 50px; background: #fff3e0;">
                  <i class="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Classes breakdown -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-3">
          <h5 class="mb-0 fw-bold"><i class="bi bi-bar-chart me-2 text-success"></i>Effectifs par classe</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Classe</th>
                  <th>Effectifs</th>
                  <th>Enseignant(s)</th>
                  <th class="text-end">Progression</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of classes">
                  <td>
                    <span class="badge fs-6" style="background: #1a6b3c;">{{ c.nom }}</span>
                  </td>
                  <td class="fw-semibold">{{ c.effectifs }}</td>
                  <td class="text-muted">—</td>
                  <td class="text-end">
                    <div class="progress" style="height: 8px; width: 120px; display: inline-flex;">
                      <div class="progress-bar bg-success" 
                           [style.width.%]="(c.effectifs / 60) * 100"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  stats = { totalEleves: 0, totalEnseignants: 0, totalClasses: 0, totalBulletins: 0, totalEncaisse: 0, nbImpayes: 0 };
  classes: any[] = [];
  anneeScolaire = this.getCurrentSchoolYear();

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getClasses().subscribe(c => {
      this.classes = c;
      this.stats.totalClasses = c.length;
    });
    this.api.getEleves().subscribe(e => this.stats.totalEleves = e.length);
    this.api.getUsers('ENSEIGNANT').subscribe(u => this.stats.totalEnseignants = u.length);
    this.api.getBulletins({}).subscribe(b => this.stats.totalBulletins = b.length);
    this.api.getPaiementStats(this.anneeScolaire).subscribe((s: any) => {
      this.stats.totalEncaisse = s.totalEncaisse || 0;
      this.stats.nbImpayes = s.nbImpayes || 0;
    });
  }

  private getCurrentSchoolYear(): string {
    const today = new Date();
    const startYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    return `${startYear}-${startYear + 1}`;
  }
}
