import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./shared/components/templates/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'mfa',
        loadComponent: () => import('./features/auth/pages/mfa/mfa.component').then(m => m.MfaComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/templates/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'wfh',
        loadComponent: () => import('./features/dashboard/pages/wfh-dashboard/wfh-dashboard.component').then(m => m.WfhDashboardComponent)
      },
      {
        path: 'arsip',
        loadComponent: () => import('./features/dashboard/pages/arsip-dashboard/arsip-dashboard.component').then(m => m.ArsipDashboardComponent)
      },
      {
        path: 'c1',
        loadComponent: () => import('./features/dashboard/pages/c1-dashboard/c1-dashboard.component').then(m => m.C1DashboardComponent)
      }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
