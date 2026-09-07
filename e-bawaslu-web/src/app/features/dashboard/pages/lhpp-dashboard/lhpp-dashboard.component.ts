import { FilePreviewComponent } from '../../../../shared/components/molecules/file-preview/file-preview.component';
import { Component, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArsipService, ArsipItem, VersionHistoryItem } from '../../../../core/services/arsip/arsip.service';
import { MasterDataService, Divisi, Tahapan } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

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
    FilePreviewComponent,
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
  private route = inject(ActivatedRoute);
  kamar = 'Pemilu';
  tahapanList: Tahapan[] = [];
  selectedDivisiFilter = '';
  selectedTahapanFilter = '';
  tahapanForm = this.fb.nonNullable.group({ nama_tahapan: ['', Validators.required], divisi_id: ['', Validators.required] });
  isSavingTahapan = false;
  isLoadingTahapan = false;
  tahapanLoadError = false;
  showInlineTahapan = false;
  pendingDeleteTahapan: Tahapan | null = null;
  deletingTahapan = false;
  @ViewChild('stageForm') stageForm?: FormGroupDirective;

  deleteTahapan() {
    const tahap = this.pendingDeleteTahapan;
    if (!tahap || this.deletingTahapan) return;
    this.deletingTahapan = true;
    this.masterDataService.deleteTahapan(tahap.id).subscribe({
      next: res => {
        this.deletingTahapan = false; this.pendingDeleteTahapan = null;
        this.tahapanList = this.tahapanList.filter(t => t.id !== tahap.id);
        if (this.selectedTahapanFilter === tahap.id) { this.selectedTahapanFilter = ''; this.loadDocuments(); }
        if (this.uploadForm.value.tahapan_id === tahap.id) this.uploadForm.patchValue({ tahapan_id: '', divisi_id: '' });
        this.showNotification(res.message, 'success');
      },
      error: err => { this.deletingTahapan = false; this.pendingDeleteTahapan = null; this.showNotification(err.error?.message || 'Gagal menghapus tahapan.', 'error'); }
    });
  }

  loadTahapan() {
    this.isLoadingTahapan = true;
    this.tahapanLoadError = false;
    this.masterDataService.getTahapan().subscribe({
      next: res => { this.tahapanList = res.data || []; this.isLoadingTahapan = false; },
      error: () => { this.isLoadingTahapan = false; this.tahapanLoadError = true; }
    });
  }

  saveTahapan() {
    if (this.tahapanForm.invalid || this.isSavingTahapan) return;
    this.isSavingTahapan = true;
    this.masterDataService.createTahapan(this.tahapanForm.getRawValue()).subscribe({
      next: res => {
        this.isSavingTahapan = false;
        this.tahapanList = [...this.tahapanList, res.data];
        if (this.showUploadModal) {
          this.uploadForm.patchValue({ tahapan_id: res.data.id, divisi_id: res.data.divisi_id });
        }
        this.showInlineTahapan = false;
        this.tahapanLoadError = false;
        this.tahapanForm.reset();
        this.stageForm?.resetForm();
        this.showNotification('Tahapan berhasil ditambahkan dan siap dipilih.');
      },
      error: err => { this.isSavingTahapan = false; this.showNotification(err.error?.message || 'Gagal menyimpan tahapan.', 'error'); }
    });
  }

  selectTahapan(id: string) {
    this.uploadForm.patchValue({ divisi_id: this.tahapanList.find(t => t.id === id)?.divisi_id || '' });
  }

  tahapanName(id?: string): string {
    return this.tahapanList.find(t => t.id === id)?.nama_tahapan || 'Belum ditentukan';
  }
  
  @ViewChild('uploadFileInput') uploadFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('revisiFileInput') revisiFileInput!: ElementRef<HTMLInputElement>;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  documents = new MatTableDataSource<ArsipItem>([]);
  divisiList: Divisi[] = [];
  searchQuery: string = '';
  
  availableYears: string[] = [];
  selectedYearFilter: string = '';

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
    kategori: ['LHP', Validators.required],
    kejadian_1: ['', Validators.maxLength(2000)],
    kejadian_2: ['', Validators.maxLength(2000)],
    kejadian_3: ['', Validators.maxLength(2000)],
    kondisi_kotak_surat: ['', Validators.maxLength(2000)],
    tahapan_id: ['', Validators.required],
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
    if (!this.authService.canAccessLhp) {
      this.showNotification('Akses Ditolak: Anda tidak memiliki akses LHP.', 'error');
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadDivisi();
    this.loadTahapan();
    this.route.queryParamMap.subscribe(params => {
      this.kamar = params.get('kamar') === 'Pilkada' ? 'Pilkada' : 'Pemilu';
      this.showUploadModal = false;
      this.loadDocuments();
    });
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
    this.arsipService.getArsip().subscribe({
      next: (res) => {
        let lhppDocs = (res.data || []).filter((doc: ArsipItem) => ['LHP', 'LHPP'].includes(doc.kategori) && (doc.jenis_pemilihan || 'Pemilu') === this.kamar);
        
        // Ekstrak tahun unik
        const years = new Set<string>();
        lhppDocs.forEach((doc: ArsipItem) => {
          if (doc.tgl_surat) {
            years.add(doc.tgl_surat.split('-')[0]);
          }
        });
        this.availableYears = Array.from(years).sort().reverse();
        
        // Filter berdasarkan tahun jika dipilih
        if (this.selectedYearFilter) {
          lhppDocs = lhppDocs.filter((doc: ArsipItem) => doc.tgl_surat?.startsWith(this.selectedYearFilter));
        }

        this.documents.data = lhppDocs.filter(doc => (!this.selectedDivisiFilter || doc.divisi_id === this.selectedDivisiFilter) && (!this.selectedTahapanFilter || doc.tahapan_id === this.selectedTahapanFilter));
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
    return this.authService.canAccessAuditLog;
  }

  onFilterYearChange(year: string) {
    this.selectedYearFilter = year;
    this.loadDocuments();
  }

  // Upload Arsip Baru
  openUploadModal() {
    this.showInlineTahapan = false;
    this.loadTahapan();
    this.uploadForm.reset({
      divisi_id: '',
      tahapan_id: '',
      no_surat: '',
      tgl_surat: new Date().toISOString().split('T')[0],
      perihal: '',
      kategori: 'LHP',
      kejadian_1: '', kejadian_2: '', kejadian_3: '', kondisi_kotak_surat: '',
      klasifikasi: 'Rahasia'
    });
    this.uploadFile = null;
    this.showUploadModal = true;
  }

  onUploadFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.uploadFile = null;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(file.name)) {
      input.value = '';
      this.showNotification('Gunakan PDF, DOC, DOCX, JPG, atau PNG maksimal 5 MB.', 'error');
      return;
    }
    this.uploadFile = file;

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
    formData.append('kategori', 'LHP');
    formData.append('jenis_pemilihan', this.kamar);
    formData.append('tahapan_id', this.uploadForm.value.tahapan_id);
    formData.append('klasifikasi', this.uploadForm.value.klasifikasi);
    ['kejadian_1', 'kejadian_2', 'kejadian_3'].map(key => (this.uploadForm.value[key] || '').trim()).filter(Boolean).forEach((note, index) => formData.append(`catatan_kejadian[${index}]`, note));
    formData.append('kondisi_kotak_surat', (this.uploadForm.value.kondisi_kotak_surat || '').trim());
    formData.append('file_dokumen', this.uploadFile);

    this.arsipService.uploadArsip(formData).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.showUploadModal = false;
        this.showNotification(res.message || 'LHP berhasil diunggah.', 'success');
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
        const ext = doc.file_path.split('.').pop() || 'pdf';
        a.download = `${doc.no_surat.replace(/\//g, '_')}.${ext}`;
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
