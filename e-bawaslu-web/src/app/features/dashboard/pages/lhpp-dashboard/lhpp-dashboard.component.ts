import { FilePreviewComponent } from '../../../../shared/components/molecules/file-preview/file-preview.component';
import { Component, inject, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Angular Material
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
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Models & Facade
import { ArsipItem, VersionHistoryItem } from '../../../../core/services/arsip/arsip.service';
import { LhppDashboardFacade } from './lhpp-dashboard.facade';
import { Tahapan } from '../../../../core/services/master-data.service';
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
  providers: [LhppDashboardFacade],
  templateUrl: './lhpp-dashboard.component.html',
  styleUrl: './lhpp-dashboard.component.css'
})
export class LhppDashboardComponent implements OnInit, OnDestroy {
  public facade = inject(LhppDashboardFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('uploadFileInput') uploadFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('revisiFileInput') revisiFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // View state
  documents = new MatTableDataSource<ArsipItem>([]);
  displayedColumns: string[] = ['no_surat', 'perihal', 'kategori', 'klasifikasi', 'versi', 'tanggal', 'aksi'];
  
  showUploadModal = false;
  showRevisiModal = false;
  showVersionModal = false;
  showDeleteModal = false;
  showInlineTahapan = false;

  selectedArsip: ArsipItem | null = null;
  deleteReason: string = '';
  revisiCatatan: string = '';
  pendingDeleteTahapan: Tahapan | null = null;
  
  availableYears: string[] = [];
  selectedYearFilter: string = '';
  selectedDivisiFilter: string = '';
  selectedTahapanFilter: string = '';

  private subs = new Subscription();

  // Component Getters for the Template (Mapping to Facade)
  get kamar() { return this.facade.kamar; }
  get authService() { return this.facade.authService; }
  get tahapanList() { return this.facade.tahapanList; }
  get tahapanForm() { return this.facade.tahapanForm; }
  get divisiList() { return this.facade.divisiList; }
  get uploadForm() { return this.facade.uploadForm; }
  get uploadFile() { return this.facade.uploadFile; }
  get revisiFile() { return this.facade.revisiFile; }
  get arsipLogs() { return this.facade.arsipLogs$; }
  get canViewLogs() { return this.authService.canAccessAuditLog; }
  get tahapanLoadError() { return this.facade.tahapanLoadError; }
  get isDownloading() { return this.facade.isDownloading; }
  get versionHistory() { return this.facade.versionHistory; }

  // Sync state values for the template since they don't use async pipe everywhere
  isSavingTahapan = false;
  isLoadingTahapan = false;
  deletingTahapan = false;
  isUploading = false;
  isSubmittingRevisi = false;
  isLoadingVersions = false;
  isDeleting = false;

  ngOnInit() {
    if (!this.facade.authService.canAccessLhp) {
      this.facade.showNotification('Akses Ditolak: Anda tidak memiliki akses LHP.', 'error');
      this.router.navigate(['/dashboard']);
      return;
    }
    this.facade.loadDivisi();
    this.facade.loadTahapan();
    
    this.subs.add(this.route.queryParamMap.subscribe(params => {
      this.facade.kamar = params.get('kamar') === 'Pilkada' ? 'Pilkada' : 'Pemilu';
      this.showUploadModal = false;
      this.facade.loadDocuments();
    }));

    this.facade.loadLogs();

    // Subscribe to loading states
    this.subs.add(this.facade.isSavingTahapan$.subscribe(val => this.isSavingTahapan = val));
    this.subs.add(this.facade.isLoadingTahapan$.subscribe(val => this.isLoadingTahapan = val));
    this.subs.add(this.facade.deletingTahapan$.subscribe(val => this.deletingTahapan = val));
    this.subs.add(this.facade.isUploading$.subscribe(val => this.isUploading = val));
    this.subs.add(this.facade.isSubmittingRevisi$.subscribe(val => this.isSubmittingRevisi = val));
    this.subs.add(this.facade.isLoadingVersions$.subscribe(val => this.isLoadingVersions = val));
    this.subs.add(this.facade.isDeleting$.subscribe(val => this.isDeleting = val));

    // Subscribe to state updates to refresh Table DataSource
    this.subs.add(this.facade.documents$.subscribe(docs => {
      // Extract available years
      const years = new Set<string>();
      docs.forEach((doc: ArsipItem) => {
        if (doc.tgl_surat) years.add(doc.tgl_surat.split('-')[0]);
      });
      this.availableYears = Array.from(years).sort().reverse();

      // Apply Filters
      let filteredDocs = docs;
      if (this.selectedYearFilter) {
        filteredDocs = filteredDocs.filter(doc => doc.tgl_surat?.startsWith(this.selectedYearFilter));
      }
      if (this.selectedDivisiFilter) {
        filteredDocs = filteredDocs.filter(doc => doc.divisi_id === this.selectedDivisiFilter);
      }
      if (this.selectedTahapanFilter) {
        filteredDocs = filteredDocs.filter(doc => doc.tahapan_id === this.selectedTahapanFilter);
      }

      this.documents.data = filteredDocs;
      if (this.paginator) {
        this.documents.paginator = this.paginator;
      }
    }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadTahapan() {
    this.facade.loadTahapan();
  }

  loadDocuments() {
    this.facade.loadDocuments();
  }

  applyFilterArsip = _.debounce((event: Event) => {
    const filterValue = (event.target as HTMLInputElement).value;
    this.documents.filter = filterValue.trim().toLowerCase();
    if (this.documents.paginator) {
      this.documents.paginator.firstPage();
    }
  }, 300);

  onFilterYearChange(year: string) {
    this.selectedYearFilter = year;
    this.loadDocuments();
  }

  // Tahapan Handlers
  saveTahapan() {
    this.facade.saveTahapan().subscribe(success => {
      if (success) {
        this.showInlineTahapan = false;
      }
    });
  }

  deleteTahapan() {
    if (this.pendingDeleteTahapan) {
      this.facade.deleteTahapan(this.pendingDeleteTahapan.id).subscribe(success => {
        if (success) this.pendingDeleteTahapan = null;
      });
    }
  }

  selectTahapan(id: string) {
    const tahap = this.facade.tahapanList.find(t => t.id === id);
    if (tahap) {
      this.facade.uploadForm.patchValue({ divisi_id: tahap.divisi_id });
    }
  }

  getDivisiName(divisiId?: string | null): string {
    if (!divisiId) return '-';
    const div = this.facade.divisiList.find(d => d.divisi_id === divisiId);
    return div ? div.nama_divisi : 'Divisi tidak ditemukan';
  }

  tahapanName(tahapanId?: string): string {
    if (!tahapanId) return '';
    const thp = this.facade.tahapanList.find(t => t.id === tahapanId);
    return thp ? thp.nama_tahapan : '';
  }

  // Upload Handlers
  openUploadModal() {
    this.facade.loadTahapan();
    this.facade.uploadForm.reset({
      divisi_id: '', tahapan_id: '', no_surat: '', tgl_surat: new Date().toISOString().split('T')[0],
      perihal: '', kategori: 'LHP', klasifikasi: 'Rahasia'
    });
    this.facade.uploadFile = null;
    this.showUploadModal = true;
    this.showInlineTahapan = false;
  }

  onUploadFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.facade.uploadFile = null;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(file.name)) {
      input.value = '';
      this.facade.showNotification('Gunakan PDF, DOC, DOCX, JPG, atau PNG maksimal 5 MB.', 'error');
      return;
    }
    this.facade.uploadFile = file;
  }

  submitUpload() {
    this.facade.submitUpload().subscribe(success => {
      if (success) {
        this.showUploadModal = false;
      }
    });
  }

  // Revisi Handlers
  openRevisiModal(doc: ArsipItem) {
    this.selectedArsip = doc;
    this.facade.revisiFile = null;
    this.revisiCatatan = '';
    this.showRevisiModal = true;
  }

  onRevisiFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.facade.revisiFile = null;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(file.name)) {
      input.value = '';
      this.facade.showNotification('Gunakan PDF, DOC, DOCX, JPG, atau PNG maksimal 5 MB.', 'error');
      return;
    }
    this.facade.revisiFile = file;
  }

  submitRevisi() {
    if (this.selectedArsip) {
      this.facade.submitRevisi(this.selectedArsip.id, this.revisiCatatan).subscribe(success => {
        if (success) this.showRevisiModal = false;
      });
    }
  }

  // Version History
  openVersionModal(doc: ArsipItem) {
    this.selectedArsip = doc;
    this.facade.loadVersionHistory(doc.id);
    this.showVersionModal = true;
  }

  // Delete
  openDeleteModal(doc: ArsipItem) {
    this.selectedArsip = doc;
    this.deleteReason = '';
    this.showDeleteModal = true;
  }

  submitDelete() {
    if (!this.selectedArsip || this.deleteReason.trim().length < 10) {
      this.facade.showNotification('Alasan wajib diisi minimal 10 karakter.', 'error');
      return;
    }
    this.facade.deleteArsip(this.selectedArsip.id, this.deleteReason).subscribe(success => {
      if (success) this.showDeleteModal = false;
    });
  }

  // Download
  downloadDocument(doc: ArsipItem) {
    this.facade.downloadDocument(doc);
  }
}
