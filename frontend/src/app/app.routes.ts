import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',      loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'portail-parent', loadComponent: () => import('./components/parent-portal/parent-portal.component').then(m => m.ParentPortalComponent) },
      { path: 'classes',        loadComponent: () => import('./components/classes/classes.component').then(m => m.ClassesComponent) },
      { path: 'eleves',         loadComponent: () => import('./components/students/students.component').then(m => m.StudentsComponent) },
      { path: 'enseignants',    loadComponent: () => import('./components/teachers/teachers.component').then(m => m.TeachersComponent) },
      { path: 'notes',          loadComponent: () => import('./components/grades/grades.component').then(m => m.GradesComponent) },
      { path: 'bulletins',      loadComponent: () => import('./components/bulletins/bulletins.component').then(m => m.BulletinsComponent) },
      { path: 'pointage',       loadComponent: () => import('./components/pointage/pointage.component').then(m => m.PointageComponent) },
      { path: 'paiements',      loadComponent: () => import('./components/paiements/paiements.component').then(m => m.PaiementsComponent) },
      { path: 'salaires',       loadComponent: () => import('./components/salaires/salaires.component').then(m => m.SalairesComponent) },
      { path: 'notifications',  loadComponent: () => import('./components/notifications/notifications.component').then(m => m.NotificationsComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
