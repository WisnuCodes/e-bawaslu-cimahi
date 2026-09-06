import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LhppService } from '../../../../core/services/p2h/lhpp.service';
import { MasterDataService, WilayahTps } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LhppItem } from '../../../../core/models/lhpp.model';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/molecules/confirm-dialog/confirm-dialog.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-p2h-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatPaginatorModule,
    DateFormatPipe
  ],
  templateUrl: './p2h-dashboard.component.html',
  styleUrl: './p2h-dashboard.component.css'
})
export class P2hDashboardComponent implements OnInit {
  private lhppService = inject(LhppService);
  private masterDataService = inject(MasterDataService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  tpsList: WilayahTps[] = [];
  selectedFilterTps: string = '';
  selectedFilterStatus: string = '';
  selectedFilterTahapan: string = '';
  searchKeyword: string = '';

  lhppList = new MatTableDataSource<LhppItem>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['nomor_judul', 'tps', 'tanggal_tahapan', 'berkas', 'status', 'pengunggah', 'aksi'];

  isUploading = false;
  selectedFile: File | null = null;
  filePreviewName: string | null = null;
  editingLhppId: string | null = null;

  tahapanOptions = [
    'Pengadaan & Distribusi Logistik',
    'Kampanye Pemilu',
    'Masa Tenang',
    'Pemungutan & Penghitungan Suara',
    'Rekapitulasi Hasil Penghitungan Suara',
    'Pencalonan & Verifikasi Berkas',
    'Penyusunan Daftar Pemilih (DPT)'
  ];

  lhppForm: FormGroup = this.fb.group({
    nomor_lhpp: [''],
    judul_laporan: ['', [Validators.required, Validators.maxLength(255)]],
    tps_id: ['', Validators.required],
    tanggal_pengawasan: [new Date().toISOString().substring(0, 10), Validators.required],
    tahapan_pemilu: ['Pemungutan & Penghitungan Suara', Validators.required],
    status_lhpp: ['Submitted', Validators.required],
    deskripsi_pengawasan: ['', [Validators.required, Validators.minLength(10)]]
  });

  get isPengawasTps(): boolean {
    return this.authService.isPengawasTps;
  }

  get isStaffP2H(): boolean {
    return this.authService.isStaffP2H;
  }

  get isAdminKordiv(): boolean {
    return this.authService.isAdminKordiv;
  }

  get canApprove(): boolean {
    return this.authService.canApprove;
  }

  get canDeleteLhpp(): boolean {
    return this.authService.canDeleteLhpp;
  }

  // Summary Metrics
  get totalLhppCount(): number {
    return this.lhppList.data.length;
  }

  get verifiedCount(): number {
    return this.lhppList.data.filter(item => item.status_lhpp === 'Verified').length;
  }

  get pendingCount(): number {
    return this.lhppList.data.filter(item => item.status_lhpp === 'Submitted').length;
  }

  get draftOrRevisionCount(): number {
    return this.lhppList.data.filter(item => item.status_lhpp === 'Draft' || item.status_lhpp === 'Rejected').length;
  }

  ngOnInit() {
    if (!this.authService.canAccessP2H) {
      this.showNotification('Akses Ditolak: Anda tidak memiliki wewenang untuk modul P2H.', 'error');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadTps();
    this.loadLhppList();
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Tutup', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? ['bg-red-600', 'text-white'] : (type === 'success' ? ['bg-green-600', 'text-white'] : [])
    });
  }

  loadTps() {
    this.masterDataService.getTps().subscribe({
      next: (res) => {
        this.tpsList = res.data || [];
        const user = this.authService.currentUser();
        if (this.isPengawasTps && user?.tps_id) {
          this.lhppForm.patchValue({ tps_id: user.tps_id });
        } else if (this.tpsList.length > 0 && !this.lhppForm.value.tps_id) {
          this.lhppForm.patchValue({ tps_id: this.tpsList[0].tps_id });
        }
      },
      error: () => this.tpsList = []
    });
  }

  loadLhppList() {
    const filters: any = {};
    if (this.selectedFilterTps) filters.tps_id = this.selectedFilterTps;
    if (this.selectedFilterStatus) filters.status = this.selectedFilterStatus;
    if (this.selectedFilterTahapan) filters.tahapan = this.selectedFilterTahapan;
    if (this.searchKeyword) filters.search = this.searchKeyword;

    this.lhppService.getLhppList(filters).subscribe({
      next: (res) => {
        this.lhppList.data = res.data || [];
        this.lhppList.paginator = this.paginator;
      },
      error: (err) => {
        console.error('Failed to load LHPP list', err);
        this.lhppList.data = [];
      }
    });
  }

  applyFilter() {
    this.loadLhppList();
  }

  resetFilter() {
    this.selectedFilterTps = '';
    this.selectedFilterStatus = '';
    this.selectedFilterTahapan = '';
    this.searchKeyword = '';
    this.loadLhppList();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] || null;
    this.selectedFile = file;
    this.filePreviewName = file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : null;
  }

  onSubmit() {
    if (this.lhppForm.invalid) {
      this.showNotification('Mohon lengkapi formulir laporan LHPP dengan benar.', 'error');
      return;
    }

    if (!this.editingLhppId && !this.selectedFile) {
      this.showNotification('Mohon pilih berkas dokumen (PDF/Gambar) untuk diunggah.', 'error');
      return;
    }

    this.isUploading = true;
    const formData = new FormData();
    formData.append('judul_laporan', this.lhppForm.value.judul_laporan);
    if (this.lhppForm.value.nomor_lhpp) {
      formData.append('nomor_lhpp', this.lhppForm.value.nomor_lhpp);
    }
    formData.append('tps_id', this.lhppForm.value.tps_id);
    formData.append('tanggal_pengawasan', this.lhppForm.value.tanggal_pengawasan);
    formData.append('tahapan_pemilu', this.lhppForm.value.tahapan_pemilu);
    formData.append('status_lhpp', this.lhppForm.value.status_lhpp);
    formData.append('deskripsi_pengawasan', this.lhppForm.value.deskripsi_pengawasan);

    if (this.selectedFile) {
      formData.append('file_dokumen', this.selectedFile);
    }

    if (this.editingLhppId) {
      this.lhppService.updateLhpp(this.editingLhppId, formData).subscribe({
        next: (res) => {
          this.isUploading = false;
          this.showNotification('Dokumen LHPP berhasil diperbarui.', 'success');
          this.resetForm();
          this.loadLhppList();
        },
        error: (err) => {
          this.isUploading = false;
          this.showNotification(err.error?.message || 'Gagal memperbarui dokumen LHPP.', 'error');
        }
      });
    } else {
      this.lhppService.uploadLhpp(formData).subscribe({
        next: (res) => {
          this.isUploading = false;
          this.showNotification('Dokumen LHPP berhasil diunggah.', 'success');
          this.resetForm();
          this.loadLhppList();
        },
        error: (err) => {
          this.isUploading = false;
          this.showNotification(err.error?.message || 'Gagal mengunggah dokumen LHPP.', 'error');
        }
      });
    }
  }

  resetForm() {
    this.selectedFile = null;
    this.filePreviewName = null;
    this.editingLhppId = null;
    const user = this.authService.currentUser();
    const defaultTpsId = (this.isPengawasTps && user?.tps_id) 
      ? user.tps_id 
      : (this.tpsList.length > 0 ? this.tpsList[0].tps_id : '');

    this.lhppForm.reset({
      nomor_lhpp: '',
      judul_laporan: '',
      tps_id: defaultTpsId,
      tanggal_pengawasan: new Date().toISOString().substring(0, 10),
      tahapan_pemilu: 'Pemungutan & Penghitungan Suara',
      status_lhpp: 'Submitted',
      deskripsi_pengawasan: ''
    });
  }

  onEdit(item: LhppItem) {
    if (this.isPengawasTps && item.status_lhpp === 'Verified') {
      this.showNotification('Dokumen LHPP yang telah diverifikasi tidak dapat diubah.', 'error');
      return;
    }

    this.editingLhppId = item.lhpp_id;
    this.filePreviewName = item.file_name ? `Berkas saat ini: ${item.file_name}` : null;
    this.selectedFile = null;

    let tgl = item.tanggal_pengawasan;
    if (tgl && tgl.includes('T')) {
      tgl = tgl.split('T')[0];
    }

    this.lhppForm.patchValue({
      nomor_lhpp: item.nomor_lhpp,
      judul_laporan: item.judul_laporan,
      tps_id: item.tps_id,
      tanggal_pengawasan: tgl,
      tahapan_pemilu: item.tahapan_pemilu,
      status_lhpp: item.status_lhpp,
      deskripsi_pengawasan: item.deskripsi_pengawasan
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showNotification('Mode Edit Dokumen LHPP diaktifkan. Silakan sesuaikan data lalu simpan.', 'info');
  }

  onVerify(item: LhppItem, status: 'Verified' | 'Rejected') {
    const actionLabel = status === 'Verified' ? 'Menyetujui (Validasi)' : 'Menolak';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Konfirmasi ${status === 'Verified' ? 'Validasi' : 'Penolakan'} LHPP`,
        message: `Apakah Anda yakin ingin ${actionLabel} dokumen LHPP "${item.judul_laporan}"?`,
        confirmText: 'Ya, Lanjutkan'
      },
      width: '400px',
      panelClass: 'premium-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.lhppService.verifyLhpp(item.lhpp_id, status).subscribe({
          next: (res) => {
            this.showNotification(res.message || `Dokumen LHPP berhasil diubah statusnya menjadi ${status}`, 'success');
            this.loadLhppList();
          },
          error: (err) => this.showNotification(err.error?.message || 'Gagal memverifikasi dokumen LHPP.', 'error')
        });
      }
    });
  }

  onDelete(item: LhppItem) {
    if (this.isPengawasTps) {
      this.showNotification('Akses Ditolak: Pengawas TPS tidak memiliki izin untuk menghapus dokumen LHPP.', 'error');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Hapus Dokumen LHPP',
        message: `PERINGATAN: Apakah Anda yakin ingin menghapus dokumen LHPP "${item.judul_laporan}" secara permanen?`,
        confirmText: 'Ya, Hapus'
      },
      width: '400px',
      panelClass: 'premium-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.lhppService.deleteLhpp(item.lhpp_id).subscribe({
          next: (res) => {
            this.showNotification(res.message || 'Dokumen LHPP berhasil dihapus.', 'success');
            this.loadLhppList();
          },
          error: (err) => this.showNotification(err.error?.message || 'Gagal menghapus dokumen LHPP.', 'error')
        });
      }
    });
  }

  downloadFile(item: LhppItem) {
    window.open(this.lhppService.getDownloadUrl(item.lhpp_id), '_blank');
  }

  getTpsInfo(tpsId: string, itemTps?: any): string {
    if (itemTps) {
      return `TPS ${itemTps.no_tps} (${itemTps.kelurahan}, Kec. ${itemTps.kecamatan})`;
    }
    const tps = this.tpsList.find(t => t.tps_id === tpsId);
    if (!tps) return tpsId;
    return `TPS ${tps.no_tps} (${tps.kelurahan}, Kec. ${tps.kecamatan})`;
  }
}
