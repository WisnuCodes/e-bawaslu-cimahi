import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  template: `
    <div class="sidebar-header">
      <div class="brand">
        <span class="brand-text">E-Bawaslu</span>
      </div>
    </div>
    <mat-nav-list class="nav-list">
      <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      
      <!-- Menu WFH: All Users -->
      <a mat-list-item routerLink="/dashboard/wfh" routerLinkActive="active-link">
        <mat-icon matListItemIcon>work</mat-icon>
        <span matListItemTitle>WFH & Presensi</span>
      </a>
      
      <!-- Menu E-Arsip: Admin Only -->
      <a *ngIf="isAdmin" mat-list-item routerLink="/dashboard/arsip" routerLinkActive="active-link">
        <mat-icon matListItemIcon>folder</mat-icon>
        <span matListItemTitle>E-Arsip</span>
      </a>
      
      <!-- Menu Form C1: Admin & PTPS Only -->
      <a *ngIf="canAccessC1" mat-list-item routerLink="/dashboard/c1" routerLinkActive="active-link">
        <mat-icon matListItemIcon>description</mat-icon>
        <span matListItemTitle>Form C1</span>
      </a>
    </mat-nav-list>
    <div class="sidebar-footer">
      <div style="padding: 1rem 16px; font-size: 0.8rem; color: var(--color-text-muted);">
        Login sebagai: <strong>{{ userRole | uppercase }}</strong>
      </div>
      <mat-nav-list>
        <a mat-list-item (click)="onLogout()" class="logout-link">
          <mat-icon matListItemIcon color="warn">logout</mat-icon>
          <span matListItemTitle style="color: #f44336">Logout</span>
        </a>
      </mat-nav-list>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--color-surface);
    }
    .sidebar-header {
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }
    .brand-text {
      font-size: 20px;
      font-weight: 500;
    }
    .nav-list {
      flex: 1;
    }
    .active-link {
      background-color: rgba(0,0,0,0.04);
      color: var(--color-primary);
    }
    .active-link mat-icon {
      color: var(--color-primary);
    }
    .sidebar-footer {
      border-top: 1px solid var(--color-border);
    }
    .logout-link {
      cursor: pointer;
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  get userRole(): string {
    const user = this.authService.currentUser();
    return user?.role || 'pegawai';
  }

  get isAdmin(): boolean {
    const role = this.userRole.toLowerCase();
    return role === 'admin' || role === 'kepala divisi';
  }

  get canAccessC1(): boolean {
    const role = this.userRole.toLowerCase();
    return this.isAdmin || role === 'ptps';
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login'])
    });
  }
}
