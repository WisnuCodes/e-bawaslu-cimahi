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
    if (this.getToken()) queueMicrotask(() => this.refreshProfile());
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

  refreshProfile() {
    this.api.get<{data: User}>('/me').subscribe({
      next: res => { this.currentUserSignal.set(res.data); localStorage.setItem('auth_user', JSON.stringify(res.data)); },
      error: () => {}
    });
  }


  get canWriteDocuments(): boolean {
    return !!this.currentUser() && !this.userRole.toLowerCase().includes('tamu');
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
    let role = this.currentUser()?.role || '';
    // Backward compatibility untuk session lama yang masih menyimpan role 'Saksi TPS'
    if (role === 'Saksi TPS') {
      role = 'Pengawas TPS';
    }
    return role;
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

  // Hak Hapus Log C1 (HANYA Kadiv P2H, Super Admin, dan Pimpinan)
  get canDeleteC1(): boolean {
    return this.isSuperAdmin || this.isPimpinan;
  }

  // Hak Edit Presensi/Absensi User Lain (HANYA Super Admin dan Pimpinan)
  get canEditPresensi(): boolean {
    return this.isSuperAdmin || this.isPimpinan;
  }

  // Hak Akses Soft Delete / Delete Arsip (Staf DILARANG delete, Kepala Divisi & Super Admin BISA)
  get canDeleteArsip(): boolean {
    return this.isSuperAdmin || this.isKepalaDivisi || this.isPimpinan;
  }

  // Hak Akses Audit Trail Forensik (Staf DILARANG akses audit log divisi lain/global)
  get canAccessAuditLog(): boolean {
    return this.isSuperAdmin || this.isPimpinan || this.isKepalaDivisi;
  }  // Pengawas TPS (Tetap pakai isSaksiTps untuk meminimalisir refaktor)
  get isSaksiTps(): boolean {
    const r = this.userRole.toLowerCase();
    return r.includes('pengawas tps') || r.includes('saksi') || r.includes('ptps');
  }

  // Divisi P2H Khusus
  get isP2H(): boolean {
    return this.userRole.toLowerCase().includes('p2h') || this.isPimpinan || this.isSuperAdmin;
  }

  // Hak Akses / Approval C1
  get canAccessC1(): boolean {
    const r = this.userRole.toLowerCase();
    const isP2H = r.includes('p2h');
    return isP2H || this.isSaksiTps || this.isSuperAdmin || this.isPimpinan || this.isKepalaDivisi || !!this.currentUser()?.divisi_id || r.includes('panwascam') || r.includes('pkd');
  }

  // Hak Akses LHP
  get canAccessLhp(): boolean {
    const r = this.userRole.toLowerCase();
    return !!this.currentUser() && (!!this.currentUser()?.divisi_id || this.isP2H || this.isKepalaDivisi || this.isStaf || this.isSaksiTps || r.includes('ptps'));
  }

  get canManageTahapan(): boolean {
    return this.isSuperAdmin || this.userRole.toLowerCase().includes('ketua');
  }

  get canWriteLhp(): boolean {
    return this.canAccessLhp && !this.userRole.toLowerCase().includes('tamu');
  }

  // Hak Ekspor Laporan Resmi BPK
  get canExportReport(): boolean {
    return this.isSuperAdmin || this.isPimpinan || this.isKepalaDivisi || this.isStaf;
  }

  get isPengawasTps(): boolean {
    return this.isSaksiTps;
  }

  get isStaffP2H(): boolean {
    const r = this.userRole.toLowerCase();
    return r.includes('p2h') && (r.includes('staf') || r.includes('pegawai'));
  }

  get isAdminKordiv(): boolean {
    return this.isSuperAdmin || this.isKepalaDivisi;
  }

  get canDeleteLhpp(): boolean {
    return this.isSuperAdmin || this.isKadivP2H || this.isPimpinan;
  }

  get canAccessP2H(): boolean {
    return this.isP2H || this.isSuperAdmin || this.isPimpinan || this.isKepalaDivisi || this.isSaksiTps;
  }
}
