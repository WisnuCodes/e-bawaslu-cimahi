import { FilePreviewComponent } from '../../../../shared/components/molecules/file-preview/file-preview.component';
import { environment } from '../../../../../environments/environment';
import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { WfhService } from '../../../../core/services/wfh/wfh.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ConfirmDialogComponent } from '../../../../shared/components/molecules/confirm-dialog/confirm-dialog.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-wfh-dashboard',
  standalone: true,
  imports: [
    FilePreviewComponent,
    CommonModule, 
    FormsModule,
    ReactiveFormsModule, 
    ButtonComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './wfh-dashboard.component.html',
  styleUrl: './wfh-dashboard.component.css'
})
export class WfhDashboardComponent implements OnInit, OnDestroy {
  private wfhService = inject(WfhService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  private showMessage(message: string) {
    this.snackBar.open(message, 'Tutup', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('izinFileInput') izinFileInput!: ElementRef<HTMLInputElement>;
  
  @ViewChild('worklogPaginator') worklogPaginator!: MatPaginator;
  @ViewChild('presensiPaginator') presensiPaginator!: MatPaginator;

  // Waktu Real-time
  currentTime: Date = new Date();
  private timerId: any;

  // Status Kehadiran
  isCheckedIn = false;
  isCheckedOut = false;
  presensiId: string | null = null;
  
  // Loading States
  isCheckingIn = false;
  isCheckingOut = false;
  isSubmittingLog = false;
  isGettingLocation = false;

  captureMode: 'checkin' | 'checkout' = 'checkin';
  
  // Webcam State
  isCameraOpen = false;
  mediaStream: MediaStream | null = null;

  presensiList = new MatTableDataSource<any>([]);
  presensiDisplayedColumns: string[] = ['nama', 'waktu_masuk', 'foto_masuk', 'status_ci', 'waktu_keluar', 'foto_keluar', 'status_co', 'lokasi', 'aksi'];

  applyFilterPresensi = _.debounce((event: Event) => {
    const filterValue = (event.target as HTMLInputElement).value;
    this.presensiList.filter = filterValue.trim().toLowerCase();
    if (this.presensiList.paginator) {
      this.presensiList.paginator.firstPage();
    }
  }, 300);

  // Presensi Edit State (Admin only)
  editingPresensiId: string | null = null;
  editPresensiStatusCI = '';
  editPresensiStatusCO = '';

  // Worklog Edit State
  isEditMode = false;
  editWorklogId: string | null = null;
  selectedFile: File | null = null;

  worklogs = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['tanggal', 'aktivitas', 'lampiran', 'status', 'aksi'];

  applyFilterWorklogs = _.debounce((event: Event) => {
    const filterValue = (event.target as HTMLInputElement).value;
    this.worklogs.filter = filterValue.trim().toLowerCase();
    if (this.worklogs.paginator) {
      this.worklogs.paginator.firstPage();
    }
  }, 300);

  worklogForm: FormGroup = this.fb.group({
    activity: ['', Validators.required]
  });

  // Izin State
  showIzinForm = false;
  isSubmittingIzin = false;
  izinForm: FormGroup = this.fb.group({
    jenis_izin: ['Sakit', Validators.required],
    keterangan_izin: ['', Validators.required]
  });
  selectedIzinFile: File | null = null;

  // Date Filters
  startDatePresensi: Date | null = new Date();
  endDatePresensi: Date | null = new Date();
  originalPresensiData: any[] = [];

  startDateWorklog: Date | null = new Date();
  endDateWorklog: Date | null = new Date();
  originalWorklogData: any[] = [];



  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isPTPS(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'PTPS' || user?.role === 'Saksi TPS';
  }

  get canApprove(): boolean {
    return this.authService.canApprove;
  }

  get canViewOthersPresensi(): boolean {
    return this.isAdmin || this.authService.isPimpinan || this.authService.isKepalaDivisi;
  }

  getAttachmentUrl(path: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const relativePath = path.replace(/^\/+/, '').replace(/^storage\//, '');
    return `${baseUrl}/storage/${relativePath}`;
  }

  get isCheckoutDisabled(): boolean {
    const hours = this.currentTime.getHours();
    const minutes = this.currentTime.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    // 08:00 is 8 * 60 = 480
    // 16:00 is 16 * 60 = 960
    return timeInMinutes >= 480 && timeInMinutes < 960;
  }

  ngOnInit() {
    this.timerId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    if (!this.canViewOthersPresensi) {
      this.presensiDisplayedColumns = ['waktu_masuk', 'foto_masuk', 'status_ci', 'waktu_keluar', 'foto_keluar', 'status_co', 'lokasi'];
    } else {
      this.presensiDisplayedColumns = ['nama', 'waktu_masuk', 'foto_masuk', 'status_ci', 'waktu_keluar', 'foto_keluar', 'status_co', 'lokasi'];
      if (this.isAdmin) {
        this.presensiDisplayedColumns.push('aksi');
      }
    }

    if (this.canApprove) {
      this.displayedColumns = ['nama', 'tanggal', 'aktivitas', 'lampiran', 'status', 'aksi'];
    } else {
      this.displayedColumns = ['tanggal', 'aktivitas', 'lampiran', 'status', 'aksi'];
    }

    this.loadWorklogs();
    this.loadPresensi();

  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.stopCamera();
  }

  loadWorklogs() {
    let startStr = this.startDateWorklog ? this.startDateWorklog.toISOString().split('T')[0] : undefined;
    let endStr = this.endDateWorklog ? this.endDateWorklog.toISOString().split('T')[0] : undefined;

    this.wfhService.getWorklogs(startStr, endStr).subscribe({
      next: (res) => {
        this.originalWorklogData = res.data || [];
        this.worklogs.data = [...this.originalWorklogData];
        this.worklogs.paginator = this.worklogPaginator;
      },
      error: () => {
        this.originalWorklogData = [];
        this.worklogs.data = [];
      }
    });
  }

  loadPresensi() {
    let startStr = this.startDatePresensi ? this.startDatePresensi.toISOString().split('T')[0] : undefined;
    let endStr = this.endDatePresensi ? this.endDatePresensi.toISOString().split('T')[0] : undefined;

    this.wfhService.getPresensi(startStr, endStr).subscribe({
      next: (res) => {
        const data = res.data || [];
        this.originalPresensiData = [...data];
        this.presensiList.data = data;
        this.presensiList.paginator = this.presensiPaginator;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const myTodayLog = data.find((p: any) => 
          p.timestamp_checkin && p.timestamp_checkin.startsWith(todayStr) && 
          p.nama_pegawai === this.authService.currentUser()?.username
        );

        if (myTodayLog) {
          this.isCheckedIn = true;
          this.presensiId = myTodayLog.presensi_id;
          this.isCheckedOut = !!myTodayLog.timestamp_checkout;
        } else {
          this.isCheckedIn = false;
          this.isCheckedOut = false;
          this.presensiId = null;
        }
      },
      error: () => {
        this.originalPresensiData = [];
        this.presensiList.data = [];
      }
    });
  }

  filterDatePresensi() {
    // Memanggil ulang data dari server dengan parameter tanggal
    this.loadPresensi();
  }

  filterDateWorklog() {
    // Memanggil ulang data dari server dengan parameter tanggal
    this.loadWorklogs();
  }



  approveWorklog(id: string, status: 'Approved' | 'Revised') {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Konfirmasi Persetujuan',
        message: `Anda yakin ingin memberikan status "${status}" pada laporan ini?`,
        confirmText: 'Ya, Lanjutkan'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.wfhService.approveWorklog(id, status).subscribe({
          next: () => {
            this.showMessage(`Worklog berhasil di-${status.toLowerCase()}!`);
            this.loadWorklogs();
          },
          error: (err) => {
            this.showMessage(err.error?.message || 'Gagal mengubah status worklog.');
          }
        });
      }
    });
  }

  openCamera(mode: 'checkin' | 'checkout') {
    this.captureMode = mode;
    this.isCameraOpen = true;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          this.mediaStream = stream;
          setTimeout(() => {
            if (this.videoElement && this.videoElement.nativeElement) {
              this.videoElement.nativeElement.srcObject = stream;
              this.videoElement.nativeElement.play();
            }
          }, 100);
        })
        .catch(err => {
          this.isCameraOpen = false;
          this.showMessage('Gagal mengakses kamera: ' + err.message);
        });
    } else {
      this.isCameraOpen = false;
      this.showMessage('Browser Anda tidak mendukung akses kamera (Webcam).');
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraOpen = false;
  }

  capturePhoto() {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    // Maksimal lebar foto untuk kompresi
    const MAX_WIDTH = 600;
    let width = video.videoWidth;
    let height = video.videoHeight;

    // Hitung proporsi dimensi baru
    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width);
      width = MAX_WIDTH;
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Gambar dengan dimensi yang sudah diperkecil
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // --- Watermark Timestamp ---
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID');
      const timestampText = `${dateStr} ${timeStr}`;

      ctx.font = 'bold 14px Arial';
      const padding = 8;
      const textWidth = ctx.measureText(timestampText).width;
      const rectHeight = 24;
      
      // Posisi di pojok kanan bawah
      const x = canvas.width - textWidth - (padding * 2) - 10;
      const y = canvas.height - rectHeight - 10;

      // Kotak background semi-transparan
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect ? ctx.roundRect(x, y, textWidth + (padding * 2), rectHeight, 4) : ctx.fillRect(x, y, textWidth + (padding * 2), rectHeight);
      ctx.fill();

      // Teks timestamp
      ctx.fillStyle = '#ffffff';
      ctx.fillText(timestampText, x + padding, y + 17);
      // -----------------------------

      // Kompres ke JPEG dengan kualitas 0.7 (biasanya menghasilkan file ~100kb - 250kb)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          this.stopCamera();
          this.processPresensi(file);
        }
      }, 'image/jpeg', 0.7);
    }
  }

  private processPresensi(file: File) {
    this.isGettingLocation = true;
    if (this.captureMode === 'checkin') {
      this.isCheckingIn = true;
    } else {
      this.isCheckingOut = true;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.isGettingLocation = false;
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          this.executePresensiApi(file, coords);
        },
        (error) => {
          this.isGettingLocation = false;
          this.isCheckingIn = false;
          this.isCheckingOut = false;
          this.showMessage('Gagal mendapatkan lokasi GPS. Mohon izinkan akses lokasi (Location) pada browser Anda.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      this.isGettingLocation = false;
      this.isCheckingIn = false;
      this.isCheckingOut = false;
      this.showMessage('Browser Anda tidak mendukung Geolocation.');
    }
  }

  private executePresensiApi(file: File, coords: string) {
    const formData = new FormData();
    formData.append('selfie_image', file);
    formData.append('gps_koordinat', coords);
    formData.append('liveness_score', '0.95');

    if (this.captureMode === 'checkin') {
      this.wfhService.checkIn(formData).subscribe({
        next: (res) => {
          this.isCheckingIn = false;
          this.showMessage('Foto berhasil diunggah. Check-in berhasil pada lokasi: ' + coords);
          this.loadPresensi();
        },
        error: (err) => {
          this.isCheckingIn = false;
          this.showMessage(err.error?.message || 'Gagal mengirim data Check In. Pastikan server API berjalan.');
        }
      });
    } else if (this.captureMode === 'checkout') {
      formData.append('presensi_id', this.presensiId || '');
      this.wfhService.checkOut(formData).subscribe({
        next: (res) => {
          this.isCheckingOut = false;
          this.showMessage('Foto berhasil diunggah. Check-out berhasil pada lokasi: ' + coords);
          this.loadPresensi();
        },
        error: (err) => {
          this.isCheckingOut = false;
          this.showMessage(err.error?.message || 'Gagal mengirim data Check Out. Pastikan server API berjalan.');
        }
      });
    }
  }

  onSubmitWorklog() {
    if (this.worklogForm.invalid) return;
    this.isSubmittingLog = true;

    const formData = new FormData();
    formData.append('tgl_kerja', new Date().toISOString().split('T')[0]);
    formData.append('rincian_aktivitas', this.worklogForm.value.activity);
    
    if (this.selectedFile) {
      formData.append('file_lampiran', this.selectedFile);
    }

    if (this.isEditMode && this.editWorklogId) {
      this.wfhService.updateWorklog(this.editWorklogId, formData).subscribe({
        next: () => {
          this.isSubmittingLog = false;
          this.showMessage('Worklog berhasil diperbarui!');
          this.cancelEdit();
          this.loadWorklogs();
        },
        error: (err) => {
          this.isSubmittingLog = false;
          this.showMessage(err.error?.message || 'Gagal memperbarui worklog.');
        }
      });
    } else {
      this.wfhService.submitWorklog(formData).subscribe({
        next: () => {
          this.isSubmittingLog = false;
          this.worklogForm.reset();
          if (this.fileInput) this.fileInput.nativeElement.value = '';
          this.selectedFile = null;
          this.showMessage('Worklog berhasil disimpan!');
          this.loadWorklogs();
        },
        error: (err) => {
          this.isSubmittingLog = false;
          this.showMessage(err.error?.message || 'Gagal mengirim worklog. Pastikan server API berjalan.');
        }
      });
    }
  }

  editWorklog(log: any) {
    this.isEditMode = true;
    this.editWorklogId = log.worklog_id;
    this.worklogForm.patchValue({
      activity: log.rincian_aktivitas || log.activity
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editWorklogId = null;
    this.selectedFile = null;
    this.worklogForm.reset();
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  deleteWorklog(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Hapus Laporan',
        message: 'Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.',
        confirmText: 'Ya, Hapus'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.wfhService.deleteWorklog(id).subscribe({
          next: () => {
            this.showMessage('Worklog berhasil dihapus.');
            this.loadWorklogs();
          },
          error: (err) => {
            this.showMessage(err.error?.message || 'Gagal menghapus worklog.');
          }
        });
      }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  toggleIzinForm() {
    this.showIzinForm = !this.showIzinForm;
    if (!this.showIzinForm) {
      this.cancelIzin();
    }
  }

  cancelIzin() {
    this.showIzinForm = false;
    this.izinForm.reset({ jenis_izin: 'Sakit' });
    this.selectedIzinFile = null;
    if (this.izinFileInput) this.izinFileInput.nativeElement.value = '';
  }

  onIzinFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedIzinFile = event.target.files[0];
    }
  }

  submitIzin() {
    if (this.izinForm.invalid || !this.selectedIzinFile) {
      this.showMessage('Harap lengkapi semua data dan unggah lampiran.');
      return;
    }
    
    this.isSubmittingIzin = true;
    const formData = new FormData();
    formData.append('jenis_izin', this.izinForm.value.jenis_izin);
    formData.append('keterangan_izin', this.izinForm.value.keterangan_izin);
    formData.append('file_lampiran', this.selectedIzinFile);

    this.wfhService.submitIzin(formData).subscribe({
      next: (res) => {
        this.isSubmittingIzin = false;
        this.showMessage(res.message || 'Pengajuan izin berhasil dicatat.');
        this.cancelIzin();
        this.loadPresensi();
      },
      error: (err) => {
        this.isSubmittingIzin = false;
        this.showMessage(err.error?.message || 'Gagal mengajukan izin.');
      }
    });
  }

  editPresensi(presensi: any) {
    this.editingPresensiId = presensi.presensi_id;
    this.editPresensiStatusCI = presensi.status_ci || 'Hadir';
    this.editPresensiStatusCO = presensi.status_co || 'Hadir';
  }

  cancelEditPresensi() {
    this.editingPresensiId = null;
    this.editPresensiStatusCI = '';
    this.editPresensiStatusCO = '';
  }

  savePresensi(id: string) {
    if (!this.editPresensiStatusCI) return;
    this.wfhService.updatePresensi(id, { status_ci: this.editPresensiStatusCI, status_co: this.editPresensiStatusCO }).subscribe({
      next: () => {
        this.editingPresensiId = null;
        this.loadPresensi();
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Gagal mengubah presensi');
      }
    });
  }

  deletePresensi(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Hapus Presensi',
        message: 'Apakah Anda yakin ingin menghapus presensi ini? Tindakan ini tidak dapat dibatalkan.',
        confirmText: 'Ya, Hapus'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.wfhService.deletePresensi(id).subscribe({
          next: () => {
            this.showMessage('Presensi berhasil dihapus.');
            this.loadPresensi();
          },
          error: (err) => {
            this.showMessage(err.error?.message || 'Gagal menghapus presensi.');
          }
        });
      }
    });
  }

  exportToCSV(type: 'presensi' | 'worklog') {
    let csvData = '';
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    let filename = '';

    if (type === 'presensi') {
      filename = `Laporan_Presensi_${dateStr}.csv`;
      const data = this.presensiList.data;
      if (!data || data.length === 0) {
        this.showMessage('Tidak ada data presensi untuk diekspor.');
        return;
      }
      // Header
      csvData += 'Nama Pegawai,Waktu Check-In,Status CI,Waktu Check-Out,Status CO,Koordinat GPS\n';
      // Rows
      data.forEach((p: any) => {
        const nama = `"${p.nama_pegawai || 'Anda'}"`;
        const ci = `"${p.timestamp_checkin || '-'}"`;
        const stCI = `"${p.status_ci || 'Hadir'}"`;
        const co = `"${p.timestamp_checkout || '-'}"`;
        const stCO = `"${p.status_co || '-'}"`;
        const gps = `"${p.gps_koordinat || '-'}"`;
        csvData += `${nama},${ci},${stCI},${co},${stCO},${gps}\n`;
      });
    } else if (type === 'worklog') {
      filename = `Laporan_Worklog_${dateStr}.csv`;
      const data = this.worklogs.data;
      if (!data || data.length === 0) {
        this.showMessage('Tidak ada data worklog untuk diekspor.');
        return;
      }
      // Header
      csvData += 'Nama Pegawai,Tanggal,Aktivitas,Status\n';
      // Rows
      data.forEach((log: any) => {
        const nama = `"${log.nama_pegawai || 'Anda'}"`;
        const tgl = `"${log.created_at || '-'}"`;
        const aktivitas = `"${(log.rincian_aktivitas || log.activity || '').replace(/"/g, '""')}"`;
        const status = `"${log.status_approval || 'Pending'}"`;
        csvData += `${nama},${tgl},${aktivitas},${status}\n`;
      });
    }

    // Create Blob and trigger download
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' }); // \ufeff is BOM for Excel UTF-8 support
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
