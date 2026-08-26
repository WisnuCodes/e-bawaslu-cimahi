import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  
  // Using Angular 16+ Signals for reactive state
  private currentUserSignal = signal<any | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  private tempUserIdSignal = signal<string | null>(null);

  // Read-only signals to expose state (like context)
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  constructor() {
    this.checkToken();
  }

  private checkToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.isAuthenticatedSignal.set(true);
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        try {
          this.currentUserSignal.set(JSON.parse(userStr));
        } catch (e) {}
      }
    }
  }

  login(credentials: any) {
    return this.api.post<any>('/login', credentials).pipe(
      tap(response => {
        if (response && response.data && response.data.user_id) {
          this.tempUserIdSignal.set(response.data.user_id);
        }
      })
    );
  }

  verifyMfa(otp: string) {
    const userId = this.tempUserIdSignal();
    return this.api.post<any>('/verify-mfa', { user_id: userId, otp }).pipe(
      tap(response => {
        if (response && response.data && response.data.access_token) {
          localStorage.setItem('auth_token', response.data.access_token);
          
          // Ensure we have a role for RBAC
          const user = response.data.user || { username: 'Admin Bawaslu', role: 'admin' };
          localStorage.setItem('auth_user', JSON.stringify(user));
          
          this.isAuthenticatedSignal.set(true);
          this.currentUserSignal.set(user);
          this.tempUserIdSignal.set(null); // clear temp
        }
      })
    );
  }

  logout() {
    return this.api.post<any>('/logout').pipe(
      tap(() => {
        this.clearAuth();
      })
    );
  }

  clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.isAuthenticatedSignal.set(false);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
