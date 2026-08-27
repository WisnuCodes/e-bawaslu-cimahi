import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  
  // Angular Signals for reactive state
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  private tempUserIdSignal = signal<string | null>(null);

  // Read-only signals
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
          
          const user = response.data.user;
          localStorage.setItem('auth_user', JSON.stringify(user));
          
          this.isAuthenticatedSignal.set(true);
          this.currentUserSignal.set(user);
          this.tempUserIdSignal.set(null);
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

  // ==========================================
  // RBAC & ABAC PERSMISSIONS (SESUAI SRS 2.3)
  // ==========================================

  get userRole(): string {
    return this.currentUser()?.role || '';
  }

  // Kelas 4: Super Administrator (IT & Security Master)
  get isSuperAdmin(): boolean {
    const r = this.userRole.toLowerCase();
    return r.includes('admin'); // Akan menangkap 'admin', 'administrator', 'super admin', 'super administrator', dll.
  }

  // Kelas 3: Administrator / Pimpinan (Ketua Komisioner & Koordinator Sekretariat)
  get isPimpinan(): boolean {
    const r = this.userRole.toLowerCase();
    return r.includes('ketua') || r.includes('koordinator sekretariat') || r.includes('pimpinan') || r === 'administrator / pimpinan';
  }

  // Kelas 2: Kepala Divisi / Kasubag / Kabag / Bendahara
  get isKepalaDivisi(): boolean {
    const r = this.userRole.toLowerCase();
    return r.includes('kordiv') || r.includes('kepala divisi') || r.includes('kasubag') || r.includes('kabag') || r.includes('bendahara');
  }

  // Kadiv P2H secara spesifik
  get isKadivP2H(): boolean {
    const r = this.userRole.toLowerCase();
    return r.includes('p2h') && (r.includes('kordiv') || r.includes('kepala divisi') || r.includes('kadiv'));
  }

  // Alias untuk Super Admin (Admin)
  get isAdmin(): boolean {
    return this.isSuperAdmin;
  }

  // Kelas 1: Staf / Pegawai (Pelaksana Operasional)
  get isStaf(): boolean {
    const r = this.userRole.toLowerCase();
    return r.startsWith('staf') || r.includes('pegawai') || r.includes('panwascam') || r.includes('pkd');
  }

  // Hak Akses Approval (Staf TIDAK BISA approval, Pimpinan & Kepala Divisi BISA)
  get canApprove(): boolean {
    return this.isSuperAdmin || this.isPimpinan || this.isKepalaDivisi;
  }

  // Hak Hapus Log C1 (HANYA Kadiv P2H dan Super Admin)
  get canDeleteC1(): boolean {
    return this.isSuperAdmin || this.isKadivP2H;
  }

  // Hak Edit Presensi/Absensi User Lain (HANYA Super Admin)
  get canEditPresensi(): boolean {
    return this.isSuperAdmin;
  }

  // Hak Akses Soft Delete / Delete Arsip (Staf DILARANG delete, Kepala Divisi & Super Admin BISA)
  get canDeleteArsip(): boolean {
    return this.isSuperAdmin || this.isKepalaDivisi || this.isPimpinan;
  }

  // Hak Akses Audit Trail Forensik (Staf DILARANG akses audit log divisi lain/global)
  get canAccessAuditLog(): boolean {
    return this.isSuperAdmin || this.isPimpinan || this.isKepalaDivisi;
  }  // Pengawas TPS
  get isSaksiTps(): boolean {
    return this.userRole.toLowerCase().includes('pengawas tps');
  }

  // Hak Akses Ingesti / Approval C1 (Khusus Divisi P2H, Pimpinan, Super Admin, & Pengawas)
  get canAccessC1(): boolean {
    const r = this.userRole.toLowerCase();
    const isP2H = r.includes('p2h');
    return this.isSuperAdmin || this.isPimpinan || isP2H || this.isSaksiTps;
  }

  // Hak Ekspor Laporan Resmi BPK
  get canExportReport(): boolean {
    return this.isSuperAdmin || this.isPimpinan || this.isKepalaDivisi || this.isStaf;
  }
}
