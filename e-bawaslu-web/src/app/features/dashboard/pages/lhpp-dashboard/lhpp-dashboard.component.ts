import { Component, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArsipService, ArsipItem, VersionHistoryItem } from '../../../../core/services/arsip/arsip.service';
import { MasterDataService, Divisi } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as _ from 'lodash';

@Component({
  selector: 'app-lhpp-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSnackBarModule
  ],
  templateUrl: './lhpp-dashboard.component.html',
  styleUrl: './lhpp-dashboard.component.css'
})
export class LhppDashboardComponent implements OnInit {
  private arsipService = inject(ArsipService);
  private masterDataService = inject(MasterDataService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  
  @ViewChild('uploadFileInput') uploadFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('revisiFileInput') revisiFileInput!: ElementRef<HTMLInputElement>;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  documents = new MatTableDataSource<ArsipItem>([]);
  divisiList: Divisi[] = [];
  selectedDivisiFilter: string = '';
  searchQuery: string = '';

  applyFilterArsip = _.debounce((event: Event) => {
    const filterValue = (event.target as HTMLInputElement).value;
    this.documents.filter = filterValue.trim().toLowerCase();
    if (this.documents.paginator) {
      this.documents.paginator.firstPage();
    }
  }, 300);

  displayedColumns: string[] = ['no_surat', 'perihal', 'kategori', 'klasifikasi', 'versi', 'tanggal', 'aksi'];
  
  // Modals & Panels
  showUploadModal = false;
  showRevisiModal = false;
  showVersionModal = false;
  showDeleteModal = false;

  // Selected Target for Modal Actions
  selectedArsip: ArsipItem | null = null;
  versionHistory: VersionHistoryItem[] = [];
  isLoadingVersions = false;

  // Loading flags
  isUploading = false;
  isSubmittingRevisi = false;
  isDeleting = false;
  isDownloading: { [id: string]: boolean } = {};

  arsipLogs: any[] = [];


  // Form Upload Arsip
  uploadForm: FormGroup = this.fb.group({
    divisi_id: ['', Validators.required],
    no_surat: ['', Validators.required],
    tgl_surat: [new Date().toISOString().split('T')[0], Validators.required],
    perihal: ['', Validators.required],
    kategori: ['LHPP', Validators.required],
    klasifikasi: ['Rahasia', Validators.required]
  });
  uploadFile: File | null = null;

  // Form Revisi
  revisiCatatan: string = '';
  revisiFile: File | null = null;

  // Form Soft Delete
  deleteReason: string = '';

  kategoriList = ['Surat Keputusan', 'Surat Masuk', 'Surat Keluar', 'Berita Acara', 'Nota Dinas', 'Laporan Pengawasan'];
  klasifikasiList = ['Biasa', 'Penting', 'Rahasia', 'Sangat Rahasia'];

  ngOnInit() {
    if (!this.authService.isP2H) {
      this.showNotification('Akses Ditolak: Hanya Divisi P2H yang berwenang mengakses Manajemen LHPP.', 'error');
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadDivisi();
    this.loadDocuments();
    if (this.canViewLogs) {
      this.loadLogs();
    }
  }

  loadDivisi() {
    this.masterDataService.getDivisi().subscribe({
      next: (res) => this.divisiList = res.data || [],
      error: () => this.divisiList = []
    });
  }

  loadDocuments() {
    this.arsipService.getArsip(this.selectedDivisiFilter || undefined).subscribe({
      next: (res) => {
        // Hanya tampilkan dokumen dengan kategori LHPP di dashboard ini
        const lhppDocs = (res.data || []).filter((doc: ArsipItem) => doc.kategori === 'LHPP');
        this.documents.data = lhppDocs;
        this.documents.paginator = this.paginator;
      },
      error: () => {
        this.documents.data = [];
      }
    });
  }

  loadLogs() {
    this.arsipService.getArsipLogs().subscribe({
      next: (res) => {
        this.arsipLogs = res.data || [];
      },
      error: () => {
        this.arsipLogs = [];
      }
    });
  }

  get canViewLogs(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    const allowedRoles = ['staf', 'kasubag', 'kabag', 'kordiv', 'ketua', 'admin', 'super_admin'];
    return allowedRoles.includes(user.role.toLowerCase()) || true; 
  }


  onFilterDivisiChange(divisiId: string) {
    this.selectedDivisiFilter = divisiId;
    this.loadDocuments();
  }

  onSearch(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    if (query.length >= 2) {
      this.arsipService.searchArsip(query).subscribe({
        next: (res) => this.documents.data = res.data || [],
        error: () => this.loadDocuments()
      });
    } else if (query.length === 0) {
      this.loadDocuments();
    }
  }

  // Upload Arsip Baru
  openUploadModal() {
    this.uploadForm.reset({
      divisi_id: this.divisiList.length > 0 ? this.divisiList[0].divisi_id : '',
      no_surat: '',
      tgl_surat: new Date().toISOString().split('T')[0],
      perihal: '',
      kategori: 'Surat Keputusan',
      klasifikasi: 'Biasa'
    });
    this.uploadFile = null;
    this.showUploadModal = true;
  }

  onUploadFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.uploadFile = event.target.files[0];
    }
  }

  submitUpload() {
    if (this.uploadForm.invalid || !this.uploadFile) {
      this.showNotification('Mohon lengkapi semua field dan sertakan file dokumen.', 'error');
      return;
    }

    this.isUploading = true;
    const formData = new FormData();
    formData.append('divisi_id', this.uploadForm.value.divisi_id);
    formData.append('no_surat', this.uploadForm.value.no_surat);
    formData.append('tgl_surat', this.uploadForm.value.tgl_surat);
    formData.append('perihal', this.uploadForm.value.perihal);
    formData.append('kategori', this.uploadForm.value.kategori);
    formData.append('klasifikasi', this.uploadForm.value.klasifikasi);
    formData.append('file_dokumen', this.uploadFile);

    this.arsipService.uploadArsip(formData).subscribe({
      next: () => {
        this.isUploading = false;
        this.showUploadModal = false;
        this.showNotification('Dokumen arsip berhasil didaftarkan (v1.0)!', 'success');
        this.loadDocuments();
        if (this.canViewLogs) this.loadLogs();
      },
      error: (err) => {
        this.isUploading = false;
        this.showNotification(err.error?.message || 'Gagal mengunggah arsip.', 'error');
      }
    });
  }

  // Revisi Dokumen
  openRevisiModal(doc: ArsipItem) {
    this.selectedArsip = doc;
    this.revisiCatatan = '';
    this.revisiFile = null;
    this.showRevisiModal = true;
  }

  onRevisiFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.revisiFile = event.target.files[0];
    }
  }

  submitRevisi() {
    if (!this.selectedArsip || !this.revisiFile || !this.revisiCatatan.trim()) {
      this.showNotification('Mohon pilih berkas revisi dan berikan catatan alasan revisi.', 'error');
      return;
    }

    this.isSubmittingRevisi = true;
    const formData = new FormData();
    formData.append('file_dokumen', this.revisiFile);
    formData.append('catatan_revisi', this.revisiCatatan);

    this.arsipService.uploadRevisi(this.selectedArsip.id, formData).subscribe({
      next: (res) => {
        this.isSubmittingRevisi = false;
        this.showRevisiModal = false;
        this.showNotification(`Revisi berhasil diunggah (${res.data?.version})!`, 'success');
        this.loadDocuments();
        if (this.canViewLogs) this.loadLogs();
      },
      error: (err) => {
        this.isSubmittingRevisi = false;
        this.showNotification(err.error?.message || 'Gagal mengunggah revisi.', 'error');
      }
    });
  }

  // Riwayat Versi
  openVersionModal(doc: ArsipItem) {
    this.selectedArsip = doc;
    this.versionHistory = [];
    this.isLoadingVersions = true;
    this.showVersionModal = true;

    this.arsipService.getVersions(doc.id).subscribe({
      next: (res) => {
        this.isLoadingVersions = false;
        this.versionHistory = res.data?.history || [];
      },
      error: () => {
        this.isLoadingVersions = false;
        this.showNotification('Gagal mengambil riwayat revisi.', 'error');
      }
    });
  }

  // Download dengan Watermark
  downloadDocument(doc: ArsipItem) {
    this.isDownloading[doc.id] = true;
    this.arsipService.downloadWatermarked(doc.id).subscribe({
      next: (blob: Blob) => {
        this.isDownloading[doc.id] = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.no_surat.replace(/\//g, '_')}_watermarked.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        if (this.canViewLogs) this.loadLogs();
      },
      error: () => {
        this.isDownloading[doc.id] = false;
        this.showNotification('Gagal mengunduh berkas dengan dynamic watermark.', 'error');
      }
    });
  }

  // Soft Delete dengan Alasan
  openDeleteModal(doc: ArsipItem) {
    this.selectedArsip = doc;
    this.deleteReason = '';
    this.showDeleteModal = true;
  }

  submitDelete() {
    if (!this.selectedArsip || this.deleteReason.trim().length < 10) {
      this.showNotification('Alasan wajib diisi minimal 10 karakter untuk Audit Trail.', 'error');
      return;
    }

    this.isDeleting = true;
    this.arsipService.deleteArsip(this.selectedArsip.id, this.deleteReason).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.showNotification('✅ Dokumen telah berhasil dihapus secara aman. (Jejak digital tersimpan di Audit Log).', 'success');
        this.loadDocuments();
        if (this.canViewLogs) this.loadLogs();
      },
      error: (err) => {
        this.isDeleting = false;
        this.showNotification(err.error?.message || 'Gagal menghapus dokumen.', 'error');
      }
    });
  }

  getDivisiName(divisiId: string): string {
    const found = this.divisiList.find(d => d.divisi_id === divisiId);
    return found ? found.nama_divisi : '-';
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Tutup', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? ['bg-red-600', 'text-white'] : (type === 'success' ? ['bg-green-600', 'text-white'] : [])
    });
  }
}
