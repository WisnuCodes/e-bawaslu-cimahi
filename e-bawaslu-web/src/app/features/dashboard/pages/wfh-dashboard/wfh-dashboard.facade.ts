import { Injectable, inject, computed, signal, DestroyRef } from '@angular/core';
import { WfhService } from '../../../../core/services/wfh/wfh.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../../../../shared/components/molecules/confirm-dialog/confirm-dialog.component';

export interface PresensiState {
  data: any[];
  isLoading: boolean;
  error: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  presensiId: string | null;
  absence: string | null;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
  isGettingLocation: boolean;
  tipeKehadiranHariIni: string | null;
  isLiburHariIni: boolean;
  keteranganLibur: string | null;
}

export interface WorklogState {
  data: any[];
  isLoading: boolean;
  error: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isSubmitting: boolean;
}

export interface IzinState {
  isSubmitting: boolean;
}

@Injectable({ providedIn: 'root' })
export class WfhDashboardFacade {
  private wfhService = inject(WfhService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  // State Signals
  private statePresensi = signal<PresensiState>({
    data: [], isLoading: false, error: null, startDate: new Date(), endDate: new Date(),
    isCheckedIn: false, isCheckedOut: false, presensiId: null, absence: null,
    isCheckingIn: false, isCheckingOut: false, isGettingLocation: false,
    tipeKehadiranHariIni: null, isLiburHariIni: false, keteranganLibur: null
  });

  private stateWorklog = signal<WorklogState>({
    data: [], isLoading: false, error: null, startDate: new Date(), endDate: new Date(),
    isSubmitting: false
  });

  private stateIzin = signal<IzinState>({ isSubmitting: false });

  // Computed Selectors
  presensiData = computed(() => this.statePresensi().data);
  presensiIsLoading = computed(() => this.statePresensi().isLoading);
  absence = computed(() => this.statePresensi().absence);
  hasTodayRecord = computed(() => !!this.statePresensi().presensiId);
  isCheckedIn = computed(() => this.statePresensi().isCheckedIn);
  isCheckedOut = computed(() => this.statePresensi().isCheckedOut);
  isCheckingIn = computed(() => this.statePresensi().isCheckingIn);
  isCheckingOut = computed(() => this.statePresensi().isCheckingOut);
  isGettingLocation = computed(() => this.statePresensi().isGettingLocation);
  startDatePresensi = computed(() => this.statePresensi().startDate);
  endDatePresensi = computed(() => this.statePresensi().endDate);
  tipeKehadiranHariIni = computed(() => this.statePresensi().tipeKehadiranHariIni);
  isLiburHariIni = computed(() => this.statePresensi().isLiburHariIni);
  keteranganLibur = computed(() => this.statePresensi().keteranganLibur);

  worklogData = computed(() => this.stateWorklog().data);
  worklogIsLoading = computed(() => this.stateWorklog().isLoading);
  isSubmittingWorklog = computed(() => this.stateWorklog().isSubmitting);
  startDateWorklog = computed(() => this.stateWorklog().startDate);
  endDateWorklog = computed(() => this.stateWorklog().endDate);

  isSubmittingIzin = computed(() => this.stateIzin().isSubmitting);

  // Permissions/Auth Selectors
  isAdmin = computed(() => this.authService.isAdmin);
  isPTPS = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'PTPS' || user?.role === 'Saksi TPS';
  });
  canApprove = computed(() => this.authService.canApprove);
  canViewOthersPresensi = computed(() => this.authService.canViewAllPresensi);
  canViewOthersWorklog = computed(() => this.authService.isAdmin || this.authService.isPimpinan || this.authService.isKepalaDivisi);
  currentUser = computed(() => this.authService.currentUser());

  private showMessage(message: string) {
    this.snackBar.open(message, 'Tutup', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' });
  }

  private dateOnly(date: Date | null): string | undefined {
    if (!date) return undefined;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Action Methods
  loadStatusHariIni() {
    this.wfhService.getStatusHariIni().subscribe({
      next: (res) => {
        this.statePresensi.update(s => ({
          ...s,
          tipeKehadiranHariIni: res.tipe_kehadiran,
          isLiburHariIni: res.is_holiday,
          keteranganLibur: res.keterangan_libur
        }));
      }
    });
  }

  loadPresensi(startDate?: Date | null, endDate?: Date | null) {
    this.statePresensi.update(s => ({ ...s, isLoading: true, startDate: startDate !== undefined ? startDate : s.startDate, endDate: endDate !== undefined ? endDate : s.endDate }));
    const sDate = this.dateOnly(this.statePresensi().startDate);
    const eDate = this.dateOnly(this.statePresensi().endDate);

    this.wfhService.getPresensi(sDate, eDate)
      .pipe(finalize(() => this.statePresensi.update(s => ({ ...s, isLoading: false }))))
      .subscribe({
        next: (res) => {
          const data = res.data || [];
          const myTodayLog = res.today;
          const absence = ['Sakit', 'Izin', 'Cuti'].includes(myTodayLog?.status_ci) ? myTodayLog.status_ci : null;
          this.statePresensi.update(s => ({
            ...s, data, error: null,
            absence,
            isCheckedIn: !!myTodayLog && !absence,
            isCheckedOut: !absence && !!myTodayLog?.timestamp_checkout,
            presensiId: myTodayLog ? myTodayLog.presensi_id : null
          }));
        },
        error: (err) => {
          this.statePresensi.update(s => ({ ...s, data: [], error: err.error?.message || 'Gagal memuat presensi' }));
        }
      });
  }

  loadWorklogs(startDate?: Date | null, endDate?: Date | null) {
    this.stateWorklog.update(s => ({ ...s, isLoading: true, startDate: startDate !== undefined ? startDate : s.startDate, endDate: endDate !== undefined ? endDate : s.endDate }));
    const sDate = this.dateOnly(this.stateWorklog().startDate);
    const eDate = this.dateOnly(this.stateWorklog().endDate);

    this.wfhService.getWorklogs(sDate, eDate)
      .pipe(finalize(() => this.stateWorklog.update(s => ({ ...s, isLoading: false }))))
      .subscribe({
        next: (res) => {
          this.stateWorklog.update(s => ({ ...s, data: res.data || [], error: null }));
        },
        error: (err) => {
          this.stateWorklog.update(s => ({ ...s, data: [], error: err.error?.message || 'Gagal memuat worklogs' }));
        }
      });
  }

  processCheckin(file: File, coords: string) {
    this.statePresensi.update(s => ({ ...s, isCheckingIn: true, isGettingLocation: false }));
    const formData = new FormData();
    formData.append('selfie_image', file);
    formData.append('gps_koordinat', coords);
    formData.append('liveness_score', '0.95');

    this.wfhService.checkIn(formData).subscribe({
      next: () => {
        this.statePresensi.update(s => ({ ...s, isCheckingIn: false }));
        this.showMessage('Foto berhasil diunggah. Check-in berhasil pada lokasi: ' + coords);
        this.loadPresensi();
      },
      error: (err) => {
        this.statePresensi.update(s => ({ ...s, isCheckingIn: false }));
        this.showMessage(err.error?.message || 'Gagal mengirim data Check In. Pastikan server API berjalan.');
      }
    });
  }

  processCheckout(file: File, coords: string) {
    this.statePresensi.update(s => ({ ...s, isCheckingOut: true, isGettingLocation: false }));
    const formData = new FormData();
    formData.append('selfie_image', file);
    formData.append('gps_koordinat', coords);
    formData.append('liveness_score', '0.95');
    formData.append('presensi_id', this.statePresensi().presensiId || '');

    this.wfhService.checkOut(formData).subscribe({
      next: () => {
        this.statePresensi.update(s => ({ ...s, isCheckingOut: false }));
        this.showMessage('Foto berhasil diunggah. Check-out berhasil pada lokasi: ' + coords);
        this.loadPresensi();
      },
      error: (err) => {
        this.statePresensi.update(s => ({ ...s, isCheckingOut: false }));
        this.showMessage(err.error?.message || 'Gagal mengirim data Check Out. Pastikan server API berjalan.');
      }
    });
  }

  setGettingLocation(status: boolean) {
    this.statePresensi.update(s => ({ ...s, isGettingLocation: status }));
  }

  submitWorklog(activity: string, file: File | null) {
    this.stateWorklog.update(s => ({ ...s, isSubmitting: true }));
    const formData = new FormData();
    formData.append('tgl_kerja', this.dateOnly(new Date())!);
    formData.append('rincian_aktivitas', activity);
    if (file) formData.append('file_lampiran', file);

    return this.wfhService.submitWorklog(formData).pipe(
      finalize(() => this.stateWorklog.update(s => ({ ...s, isSubmitting: false })))
    );
  }

  updateWorklog(id: string, activity: string, file: File | null) {
    this.stateWorklog.update(s => ({ ...s, isSubmitting: true }));
    const formData = new FormData();
    formData.append('rincian_aktivitas', activity);
    if (file) formData.append('file_lampiran', file);

    return this.wfhService.updateWorklog(id, formData).pipe(
      finalize(() => this.stateWorklog.update(s => ({ ...s, isSubmitting: false })))
    );
  }

  deleteWorklog(id: string) {
    return this.wfhService.deleteWorklog(id);
  }

  approveWorklog(id: string, status: 'Approved' | 'Revised', notes?: string) {
    return this.wfhService.approveWorklog(id, status, notes);
  }

  submitIzin(jenisIzin: string, keterangan: string, file: File) {
    this.stateIzin.update(s => ({ ...s, isSubmitting: true }));
    const formData = new FormData();
    formData.append('jenis_izin', jenisIzin);
    formData.append('keterangan_izin', keterangan);
    formData.append('file_lampiran', file);

    return this.wfhService.submitIzin(formData).pipe(
      finalize(() => this.stateIzin.update(s => ({ ...s, isSubmitting: false })))
    );
  }

  updatePresensiStatus(id: string, statusCI: string, statusCO: string) {
    return this.wfhService.updatePresensi(id, { status_ci: statusCI, status_co: statusCO });
  }

  deletePresensi(id: string) {
    return this.wfhService.deletePresensi(id);
  }
}
