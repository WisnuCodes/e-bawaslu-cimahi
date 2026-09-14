import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatListModule, MatRippleModule, MatDividerModule, MatExpansionModule, MatButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  private _isCollapsed = false;
  isPemiluOpen = true;
  isPilkadaOpen = true;

  /** Di mobile (≤768px), sidebar selalu expanded karena menggunakan mat-sidenav overlay. */
  get isCollapsed(): boolean {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return false;
    }
    return this._isCollapsed;
  }

  toggleSidebar() {
    this._isCollapsed = !this._isCollapsed;
  }

  togglePemilu() {
    if (!this.isCollapsed) {
      this.isPemiluOpen = !this.isPemiluOpen;
    }
  }

  togglePilkada() {
    if (!this.isCollapsed) {
      this.isPilkadaOpen = !this.isPilkadaOpen;
    }
  }

  get userRole(): string {
    const user = this.authService.currentUser();
    return user?.role || 'Aparatur Bawaslu';
  }

  get isPTPS(): boolean {
    return this.userRole === 'PTPS' || this.userRole === 'Pengawas TPS';
  }

  get isPimpinan(): boolean {
    return this.authService.isPimpinan;
  }

  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin;
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => {
        this.authService.clearAuth();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
