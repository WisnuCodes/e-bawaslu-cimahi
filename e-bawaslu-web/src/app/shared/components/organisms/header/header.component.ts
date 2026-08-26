import { Component, inject, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  public authService = inject(AuthService);

  @Input() isMobile = false;
  @Output() toggleMenu = new EventEmitter<void>();

  user = this.authService.currentUser;

  userName = computed(() => {
    const u = this.user();
    return u?.username || u?.name || 'Aparatur Bawaslu';
  });

  userRole = computed(() => {
    const u = this.user();
    return u?.role || 'Aparatur Bawaslu';
  });

  userInitial = computed(() => {
    const name = this.userName();
    return name ? name.charAt(0).toUpperCase() : 'B';
  });

  onToggleMenu() {
    this.toggleMenu.emit();
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        window.location.href = '/auth/login';
      },
      error: () => {
        this.authService.clearAuth();
        window.location.href = '/auth/login';
      }
    });
  }
}
