import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  public authService = inject(AuthService);
  
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
