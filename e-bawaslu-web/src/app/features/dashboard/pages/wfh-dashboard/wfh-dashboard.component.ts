import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WfhService } from '../../../../core/services/wfh/wfh.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-wfh-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
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
    MatSelectModule
  ],
  templateUrl: './wfh-dashboard.component.html',
  styleUrl: './wfh-dashboard.component.css'
})
export class WfhDashboardComponent implements OnInit, OnDestroy {
  private wfhService = inject(WfhService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

  presensiList: any[] = [];
  presensiDisplayedColumns: string[] = ['nama', 'waktu_masuk', 'foto_masuk', 'waktu_keluar', 'foto_keluar', 'status', 'aksi'];

  // Presensi Edit State (Admin only)
  editingPresensiId: string | null = null;
  editPresensiStatus: string = '';

  // Worklog Edit State
  isEditMode = false;
  editWorklogId: string | null = null;
  selectedFile: File | null = null;

  worklogs: any[] = [];
  displayedColumns: string[] = ['tanggal', 'aktivitas', 'lampiran', 'status', 'aksi'];

  worklogForm: FormGroup = this.fb.group({
    activity: ['', Validators.required]
  });

  get isAdmin(): boolean {
    const user = this.authService.currentUser();
    const role = (user?.role || '').toLowerCase();
    return role === 'admin' || role === 'kepala divisi';
  }

  getAttachmentUrl(path: string | null): string {
    if (!path) return '';
    return `http://localhost:8000/storage/${path}`;
  }

  ngOnInit() {
    this.timerId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    if (!this.isAdmin) {
      this.presensiDisplayedColumns = ['waktu_masuk', 'foto_masuk', 'waktu_keluar', 'foto_keluar', 'status'];
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
    this.wfhService.getWorklogs().subscribe({
      next: (res) => {
        this.worklogs = res.data || [];
      },
      error: () => {
        this.worklogs = [];
      }
    });
  }

  loadPresensi() {
    this.wfhService.getPresensi().subscribe({
      next: (res) => {
        this.presensiList = res.data || [];
        
        // Cek status hari ini langsung dari database (jangan pakai local storage)
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Cari record presensi kita hari ini
        const myTodayLog = this.presensiList.find(p => 
          p.timestamp_checkin.startsWith(todayStr) && 
          p.nama_pegawai === this.authService.currentUser()?.username
        );

        if (myTodayLog) {
          this.isCheckedIn = true;
          this.presensiId = myTodayLog.presensi_id;
          
          if (myTodayLog.timestamp_checkout) {
            this.isCheckedOut = true;
          } else {
            this.isCheckedOut = false;
          }
        } else {
          this.isCheckedIn = false;
          this.isCheckedOut = false;
          this.presensiId = null;
        }
      },
      error: () => {
        this.presensiList = [];
      }
    });
  }

  approveWorklog(id: string, status: 'Approved' | 'Revised') {
    if (!confirm(`Anda yakin ingin memberikan status "${status}" pada laporan ini?`)) return;
    
    this.wfhService.approveWorklog(id, status).subscribe({
      next: () => {
        alert(`Worklog berhasil di-${status.toLowerCase()}!`);
        this.loadWorklogs(); // Reload table
      },
      error: (err) => {
        alert(err.error?.message || 'Gagal mengubah status worklog.');
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
          // Timeout to wait for Angular to render the *ngIf video element
          setTimeout(() => {
            if (this.videoElement && this.videoElement.nativeElement) {
              this.videoElement.nativeElement.srcObject = stream;
              this.videoElement.nativeElement.play();
            }
          }, 100);
        })
        .catch(err => {
          this.isCameraOpen = false;
          alert('Gagal mengakses kamera: ' + err.message);
        });
    } else {
      this.isCameraOpen = false;
      alert('Browser Anda tidak mendukung akses kamera (Webcam).');
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

    // Set canvas dimensions identical to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to Blob/File
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          this.stopCamera(); // Turn off camera immediately after capturing
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

    // Dapatkan GPS Lokasi
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
          alert('Gagal mendapatkan lokasi GPS. Mohon izinkan akses lokasi (Location) pada browser Anda.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      this.isGettingLocation = false;
      this.isCheckingIn = false;
      this.isCheckingOut = false;
      alert('Browser Anda tidak mendukung Geolocation.');
    }
  }

  private executePresensiApi(file: File, coords: string) {
    const formData = new FormData();
    formData.append('selfie_image', file);
    formData.append('gps_koordinat', coords);
    formData.append('liveness_score', '0.95'); // Mock liveness score

    if (this.captureMode === 'checkin') {
      this.wfhService.checkIn(formData).subscribe({
        next: (res) => {
          this.isCheckingIn = false;
          alert('Berhasil Check In pada lokasi: ' + coords);
          this.loadPresensi(); // Refresh dari database
        },
        error: (err) => {
          this.isCheckingIn = false;
          alert(err.error?.message || 'Gagal mengirim data Check In. Pastikan server API berjalan.');
        }
      });
    } else if (this.captureMode === 'checkout') {
      formData.append('presensi_id', this.presensiId || '');
      this.wfhService.checkOut(formData).subscribe({
        next: (res) => {
          this.isCheckingOut = false;
          alert('Berhasil Check Out pada lokasi: ' + coords);
          this.loadPresensi(); // Refresh dari database
        },
        error: (err) => {
          this.isCheckingOut = false;
          alert(err.error?.message || 'Gagal mengirim data Check Out. Pastikan server API berjalan.');
        }
      });
    }
  }

  onSubmitWorklog() {
    if (this.worklogForm.invalid) return;
    this.isSubmittingLog = true;

    const formData = new FormData();
    formData.append('tgl_kerja', new Date().toISOString().split('T')[0]); // format: YYYY-MM-DD
    formData.append('rincian_aktivitas', this.worklogForm.value.activity);
    
    if (this.selectedFile) {
      formData.append('file_lampiran', this.selectedFile);
    }

    if (this.isEditMode && this.editWorklogId) {
      this.wfhService.updateWorklog(this.editWorklogId, formData).subscribe({
        next: () => {
          this.isSubmittingLog = false;
          alert('Worklog berhasil diperbarui!');
          this.cancelEdit();
          this.loadWorklogs();
        },
        error: (err) => {
          this.isSubmittingLog = false;
          alert(err.error?.message || 'Gagal memperbarui worklog.');
        }
      });
    } else {
      this.wfhService.submitWorklog(formData).subscribe({
        next: () => {
          this.isSubmittingLog = false;
          this.worklogForm.reset();
          if (this.fileInput) this.fileInput.nativeElement.value = '';
          this.selectedFile = null;
          alert('Worklog berhasil disimpan!');
          this.loadWorklogs();
        },
        error: (err) => {
          this.isSubmittingLog = false;
          alert(err.error?.message || 'Gagal mengirim worklog. Pastikan server API berjalan.');
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
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    this.wfhService.deleteWorklog(id).subscribe({
      next: () => {
        alert('Worklog berhasil dihapus.');
        this.loadWorklogs();
      },
      error: (err) => {
        alert(err.error?.message || 'Gagal menghapus worklog.');
      }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  // Edit Presensi Inline
  editPresensi(presensi: any) {
    this.editingPresensiId = presensi.presensi_id;
    this.editPresensiStatus = presensi.status_kehadiran || 'Hadir';
  }

  cancelEditPresensi() {
    this.editingPresensiId = null;
    this.editPresensiStatus = '';
  }

  savePresensi(id: string) {
    if (!this.editPresensiStatus) return;
    this.wfhService.updatePresensi(id, { status_kehadiran: this.editPresensiStatus }).subscribe({
      next: (res) => {
        this.editingPresensiId = null;
        this.loadPresensi();
      },
      error: (err) => {
        alert(err.error?.message || 'Gagal mengubah presensi');
      }
    });
  }

  deletePresensi(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus presensi ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    this.wfhService.deletePresensi(id).subscribe({
      next: () => {
        alert('Presensi berhasil dihapus.');
        this.loadPresensi();
      },
      error: (err) => {
        alert(err.error?.message || 'Gagal menghapus presensi.');
      }
    });
  }
}
