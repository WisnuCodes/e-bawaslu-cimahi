import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <mat-toolbar class="header-toolbar">
      <span>Beranda</span>
      <span class="spacer"></span>
      <button mat-icon-button>
        <mat-icon>notifications</mat-icon>
      </button>
      <button mat-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
        {{ userName() }}
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item>
          <mat-icon>person</mat-icon>
          <span>Profil</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }
    .spacer {
      flex: 1 1 auto;
    }
  `]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  
  user = this.authService.currentUser;

  userName = computed(() => {
    const u = this.user();
    return u?.username || u?.name || 'Administrator';
  });
}
