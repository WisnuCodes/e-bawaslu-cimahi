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
import { ConfirmDialogComponent } from '../../../../shared/components/molecules/confirm-dialog/confirm-dialog.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-wfh-dashboard',
  standalone: true,
  imports: [
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
    MatDialogModule
  ],
  templateUrl: './wfh-dashboard.component.html',
  styleUrl: './wfh-dashboard.component.css'
})
export class WfhDashboardComponent implements OnInit, OnDestroy {
  private wfhService = inject(WfhService);
  private authService = inject(AuthService);
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

  // Tukin State
  tukinList: any[] = [];
  selectedTukinBulan: number = new Date().getMonth() + 1;
  selectedTukinTahun: number = new Date().getFullYear();
  isCalculatingTukin: boolean = false;
  latestTukin: any = null;
  tukinColumns: string[] = ['periode', 'jam_kerja', 'keterlambatan', 'total_tukin'];

  months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get canApprove(): boolean {
    return this.authService.canApprove;
  }

  get canViewOthersPresensi(): boolean {
    return this.isAdmin || this.authService.isPimpinan || this.authService.isKepalaDivisi;
  }

  getAttachmentUrl(path: string | null): string {
    if (!path) return '';
    return `http://localhost:8000/storage/${path}`;
  }

  ngOnInit() {
    this.timerId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    if (!this.canViewOthersPresensi) {
      this.presensiDisplayedColumns = ['waktu_masuk', 'foto_masuk', 'waktu_keluar', 'foto_keluar', 'lokasi', 'status'];
    } else {
      this.presensiDisplayedColumns = ['nama', 'waktu_masuk', 'foto_masuk', 'waktu_keluar', 'foto_keluar', 'lokasi', 'status'];
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
    this.loadTukin();
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.stopCamera();
  }

  loadWorklogs() {
    this.wfhService.getWorklogs().subscribe({
      next: (res) => {
        this.worklogs.data = res.data || [];
        this.worklogs.paginator = this.worklogPaginator;
      },
      error: () => {
        this.worklogs.data = [];
      }
    });
  }

  loadPresensi() {
    this.wfhService.getPresensi().subscribe({
      next: (res) => {
        const data = res.data || [];
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
        this.presensiList.data = [];
      }
    });
  }

  loadTukin() {
    this.wfhService.getTukin().subscribe({
      next: (res) => {
        this.tukinList = res.data || [];
        if (this.tukinList.length > 0) {
          this.latestTukin = this.tukinList[0];
        }
      },
      error: () => {
        this.tukinList = [];
      }
    });
  }

  onCalculateTukin() {
    this.isCalculatingTukin = true;
    this.wfhService.calculateTukin(this.selectedTukinBulan, this.selectedTukinTahun).subscribe({
      next: (res) => {
        this.isCalculatingTukin = false;
        this.latestTukin = res.data;
        this.showMessage('Kalkulasi Tukin berhasil diperbarui!');
        this.loadTukin();
      },
      error: (err) => {
        this.isCalculatingTukin = false;
        this.showMessage(err.error?.message || 'Gagal menghitung Tunjangan Kinerja.');
      }
    });
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          this.stopCamera();
          this.processPresensi(file);
        }
      }, 'image/jpeg', 0.9);
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
          this.showMessage('Berhasil Check In pada lokasi: ' + coords);
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
          this.showMessage('Berhasil Check Out pada lokasi: ' + coords);
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
}
