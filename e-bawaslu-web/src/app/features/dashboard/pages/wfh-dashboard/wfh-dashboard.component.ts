import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WfhDashboardFacade } from './wfh-dashboard.facade';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

// Dumb Components
import { WfhPresensiActionComponent } from './components/wfh-presensi-action/wfh-presensi-action.component';
import { WfhPresensiTableComponent } from './components/wfh-presensi-table/wfh-presensi-table.component';
import { WfhWorklogFormComponent } from './components/wfh-worklog-form/wfh-worklog-form.component';
import { WfhWorklogTableComponent } from './components/wfh-worklog-table/wfh-worklog-table.component';
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-wfh-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTabsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatProgressSpinnerModule,
    ButtonComponent,
    WfhPresensiActionComponent,
    WfhWorklogFormComponent,
    WfhPresensiTableComponent,
    WfhWorklogTableComponent
  ],
  templateUrl: './wfh-dashboard.component.html',
  styleUrl: './wfh-dashboard.component.css'
})
export class WfhDashboardComponent implements OnInit, OnDestroy {
  public facade = inject(WfhDashboardFacade);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // Component local state for things that don't need to be in facade
  currentTime: Date = new Date();
  private timerId: any;

  captureMode: 'checkin' | 'checkout' = 'checkin';
  isCameraOpen = false;

  presensiDisplayedColumns: string[] = [];
  worklogDisplayedColumns: string[] = [];

  // Edit Presensi State (Admin only)
  editingPresensiId: string | null = null;
  editPresensiStatusCI = '';
  editPresensiStatusCO = '';

  // Edit Worklog State
  isEditMode = false;
  editWorklogId: string | null = null;
  editWorklogActivity = '';

  // Izin State
  showIzinForm = false;
  izinForm: FormGroup = this.fb.group({
    jenis_izin: ['Sakit', Validators.required],
    keterangan_izin: ['', Validators.required]
  });
  selectedIzinFile: File | null = null;
  izinFileInputValue = ''; // Used to clear input programmatically

  get isCheckoutDisabled(): boolean {
    const hours = this.currentTime.getHours();
    const minutes = this.currentTime.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    // 08:00 is 480, 16:00 is 960
    return timeInMinutes >= 480 && timeInMinutes < 960;
  }

  ngOnInit() {
    this.timerId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    // Setup Columns
    if (!this.facade.canViewOthersPresensi()) {
      this.presensiDisplayedColumns = ['waktu_masuk', 'foto_masuk', 'status_ci', 'waktu_keluar', 'foto_keluar', 'status_co', 'lokasi'];
    } else {
      this.presensiDisplayedColumns = ['nama', 'waktu_masuk', 'foto_masuk', 'status_ci', 'waktu_keluar', 'foto_keluar', 'status_co', 'lokasi'];
      if (this.facade.isAdmin()) {
        this.presensiDisplayedColumns.push('aksi');
      }
    }

    if (this.facade.canApprove()) {
      this.worklogDisplayedColumns = ['nama', 'tanggal', 'aktivitas', 'lampiran', 'status', 'aksi'];
    } else {
      this.worklogDisplayedColumns = ['tanggal', 'aktivitas', 'lampiran', 'status', 'aksi'];
    }

    this.facade.loadWorklogs();
    this.facade.loadPresensi();
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  // --- Camera Actions ---
  onOpenCamera(mode: 'checkin' | 'checkout') {
    this.captureMode = mode;
    this.isCameraOpen = true;
  }

  onStopCamera() {
    this.isCameraOpen = false;
  }

  onCapturePhoto(file: File) {
    this.facade.setGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          if (this.captureMode === 'checkin') {
            this.facade.processCheckin(file, coords);
          } else {
            this.facade.processCheckout(file, coords);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          this.facade.setGettingLocation(false);
          this.snackBar.open('Gagal mendapatkan lokasi. Pastikan izin lokasi (GPS) diaktifkan di browser Anda.', 'Tutup', { duration: 5000 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      this.facade.setGettingLocation(false);
      this.snackBar.open('Geolokasi tidak didukung oleh browser ini.', 'Tutup', { duration: 5000 });
    }
  }

  // --- Worklog Form Actions ---
  onSubmitWorklog(event: { activity: string, file: File | null }) {
    if (this.isEditMode && this.editWorklogId) {
      this.facade.updateWorklog(this.editWorklogId, event.activity, event.file).subscribe({
        next: () => {
          this.snackBar.open('Worklog berhasil diperbarui!', 'Tutup', { duration: 3000 });
          this.cancelEditWorklog();
          this.facade.loadWorklogs();
        }
      });
    } else {
      this.facade.submitWorklog(event.activity, event.file).subscribe({
        next: () => {
          this.snackBar.open('Worklog berhasil disimpan!', 'Tutup', { duration: 3000 });
          this.facade.loadWorklogs();
        }
      });
    }
  }

  onEditWorklog(log: any) {
    this.isEditMode = true;
    this.editWorklogId = log.worklog_id;
    this.editWorklogActivity = log.rincian_aktivitas || log.activity;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditWorklog() {
    this.isEditMode = false;
    this.editWorklogId = null;
    this.editWorklogActivity = '';
  }

  // --- Presensi Table Actions ---
  onEditPresensi(presensi: any) {
    this.editingPresensiId = presensi.presensi_id;
    this.editPresensiStatusCI = presensi.status_ci || 'Hadir';
    this.editPresensiStatusCO = presensi.status_co || 'Hadir';
  }

  cancelEditPresensi() {
    this.editingPresensiId = null;
    this.editPresensiStatusCI = '';
    this.editPresensiStatusCO = '';
  }

  onSavePresensi(event: { id: string, statusCI: string, statusCO: string }) {
    this.facade.updatePresensiStatus(event.id, event.statusCI, event.statusCO).subscribe({
      next: () => {
        this.editingPresensiId = null;
        this.facade.loadPresensi();
      }
    });
  }

  // --- Izin Actions ---
  toggleIzinForm() {
    this.showIzinForm = !this.showIzinForm;
    if (!this.showIzinForm) this.cancelIzin();
  }

  cancelIzin() {
    this.showIzinForm = false;
    this.izinForm.reset({ jenis_izin: 'Sakit' });
    this.selectedIzinFile = null;
    this.izinFileInputValue = '';
  }

  onIzinFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedIzinFile = event.target.files[0];
    }
  }

  submitIzin() {
    if (this.izinForm.invalid || !this.selectedIzinFile) {
      this.snackBar.open('Harap lengkapi semua data dan unggah lampiran.', 'Tutup', { duration: 3000 });
      return;
    }
    
    this.facade.submitIzin(this.izinForm.value.jenis_izin, this.izinForm.value.keterangan_izin, this.selectedIzinFile).subscribe({
      next: () => {
        this.snackBar.open('Pengajuan izin berhasil dicatat.', 'Tutup', { duration: 3000 });
        this.cancelIzin();
        this.facade.loadPresensi();
      }
    });
  }

  // CSV Exports
  exportPresensi() {
    let csvData = 'Nama Pegawai,Waktu Check-In,Status CI,Waktu Check-Out,Status CO,Koordinat GPS\n';
    this.facade.presensiData().forEach((p: any) => {
      const nama = `"${p.nama_pegawai || 'Anda'}"`;
      const ci = `"${p.timestamp_checkin || '-'}"`;
      const stCI = `"${p.status_ci || 'Hadir'}"`;
      const co = `"${p.timestamp_checkout || '-'}"`;
      const stCO = `"${p.status_co || '-'}"`;
      const gps = `"${p.gps_koordinat || '-'}"`;
      csvData += `${nama},${ci},${stCI},${co},${stCO},${gps}\n`;
    });
    this.triggerDownload(csvData, `Laporan_Presensi_${new Date().toISOString().split('T')[0]}.csv`);
  }

  exportWorklog() {
    let csvData = 'Nama Pegawai,Tanggal,Aktivitas,Status\n';
    this.facade.worklogData().forEach((log: any) => {
      const nama = `"${log.nama_pegawai || 'Anda'}"`;
      const tgl = `"${log.created_at || '-'}"`;
      const aktivitas = `"${(log.rincian_aktivitas || log.activity || '').replace(/"/g, '""')}"`;
      const status = `"${log.status_approval || 'Pending'}"`;
      csvData += `${nama},${tgl},${aktivitas},${status}\n`;
    });
    this.triggerDownload(csvData, `Laporan_Worklog_${new Date().toISOString().split('T')[0]}.csv`);
  }

  private triggerDownload(csvData: string, filename: string) {
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}
