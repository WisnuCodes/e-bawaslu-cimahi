import { Injectable, inject, signal, computed } from '@angular/core';
import { ArsipService, ArsipItem, VersionHistoryItem } from '../../../../core/services/arsip/arsip.service';
import { MasterDataService, Divisi } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';

export interface ArsipState {
  documents: ArsipItem[];
  divisiList: Divisi[];
  selectedDivisiFilter: string;
  selectedYearFilter: string;
  availableYears: string[];
  searchQuery: string;
  selectedJenjang: string;
  
  showUploadModal: boolean;
  showRevisiModal: boolean;
  showVersionModal: boolean;
  showDeleteModal: boolean;

  selectedArsip: ArsipItem | null;
  versionHistory: VersionHistoryItem[];
  
  isLoadingVersions: boolean;
  isUploading: boolean;
  isSubmittingRevisi: boolean;
  isDeleting: boolean;
  isDownloading: { [id: string]: boolean };
  arsipLogs: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ArsipFacade {
  private arsipService = inject(ArsipService);
  private masterDataService = inject(MasterDataService);
  public authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Initial State
  private state = signal<ArsipState>({
    documents: [],
    divisiList: [],
    selectedDivisiFilter: '',
    selectedYearFilter: '',
    availableYears: [],
    searchQuery: '',
    selectedJenjang: '',
    showUploadModal: false,
    showRevisiModal: false,
    showVersionModal: false,
    showDeleteModal: false,
    selectedArsip: null,
    versionHistory: [],
    isLoadingVersions: false,
    isUploading: false,
    isSubmittingRevisi: false,
    isDeleting: false,
    isDownloading: {},
    arsipLogs: []
  });

  // Selectors
  readonly documents = computed(() => this.state().documents);
  readonly divisiList = computed(() => this.state().divisiList);
  readonly availableYears = computed(() => this.state().availableYears);
  readonly selectedDivisiFilter = computed(() => this.state().selectedDivisiFilter);
  readonly selectedYearFilter = computed(() => this.state().selectedYearFilter);
  readonly selectedJenjang = computed(() => this.state().selectedJenjang);
  readonly searchQuery = computed(() => this.state().searchQuery);
  readonly showUploadModal = computed(() => this.state().showUploadModal);
  readonly showRevisiModal = computed(() => this.state().showRevisiModal);
  readonly showVersionModal = computed(() => this.state().showVersionModal);
  readonly showDeleteModal = computed(() => this.state().showDeleteModal);
  readonly selectedArsip = computed(() => this.state().selectedArsip);
  readonly versionHistory = computed(() => this.state().versionHistory);
  readonly isLoadingVersions = computed(() => this.state().isLoadingVersions);
  readonly isUploading = computed(() => this.state().isUploading);
  readonly isSubmittingRevisi = computed(() => this.state().isSubmittingRevisi);
  readonly isDeleting = computed(() => this.state().isDeleting);
  readonly isDownloading = computed(() => this.state().isDownloading);
  readonly arsipLogs = computed(() => this.state().arsipLogs);

  readonly canViewLogs = computed(() => this.authService.canAccessAuditLog);

  loadDivisi() {
    this.masterDataService.getDivisi().subscribe({
      next: (res: any) => {
        this.updateState({ divisiList: res.data || [] });
      },
      error: () => this.updateState({ divisiList: [] })
    });
  }

  loadDocuments(paginator?: MatPaginator) {
    const filter = this.selectedDivisiFilter() || undefined;
    this.arsipService.getArsip(filter).subscribe({
      next: (res: any) => {
        let docs = res.data || [];
        
        // Ekstrak tahun unik
        const years = new Set<string>();
        docs.forEach((doc: ArsipItem) => {
          if (doc.tgl_surat) {
            years.add(doc.tgl_surat.split('-')[0]);
          }
        });
        const availableYears = Array.from(years).sort().reverse();
        
        // Filter berdasarkan tahun jika dipilih
        const yearFilter = this.selectedYearFilter();
        if (yearFilter) {
          docs = docs.filter((doc: ArsipItem) => doc.tgl_surat?.startsWith(yearFilter));
        }

        const jenjang = this.selectedJenjang();
        const filteredDocs = docs.filter((doc: ArsipItem) => !jenjang || doc.jenjang_pengawas === jenjang);

        this.updateState({ documents: filteredDocs, availableYears });
      },
      error: () => {
        this.updateState({ documents: [] });
      }
    });
  }

  loadLogs() {
    this.arsipService.getArsipLogs().subscribe({
      next: (res: any) => {
        this.updateState({ arsipLogs: res.data || [] });
      },
      error: () => {
        this.updateState({ arsipLogs: [] });
      }
    });
  }

  setFilter(key: 'selectedDivisiFilter' | 'selectedYearFilter' | 'selectedJenjang' | 'searchQuery', value: string) {
    this.updateState({ [key]: value });
    if (key !== 'searchQuery') {
      this.loadDocuments();
    }
  }

  setModal(key: 'showUploadModal' | 'showRevisiModal' | 'showVersionModal' | 'showDeleteModal', value: boolean) {
    this.updateState({ [key]: value });
  }

  setSelectedArsip(doc: ArsipItem | null) {
    this.updateState({ selectedArsip: doc });
  }

  uploadArsip(formData: FormData) {
    this.updateState({ isUploading: true });
    this.arsipService.uploadArsip(formData).subscribe({
      next: () => {
        this.updateState({ isUploading: false, showUploadModal: false });
        this.showNotification('Dokumen arsip berhasil didaftarkan (v1.0)!', 'success');
        this.loadDocuments();
        if (this.canViewLogs()) this.loadLogs();
      },
      error: (err: any) => {
        this.updateState({ isUploading: false });
        this.showNotification(err.error?.message || 'Gagal mengunggah arsip.', 'error');
      }
    });
  }

  uploadRevisi(id: number | string, formData: FormData) {
    this.updateState({ isSubmittingRevisi: true });
    this.arsipService.uploadRevisi(id.toString(), formData).subscribe({
      next: (res: any) => {
        this.updateState({ isSubmittingRevisi: false, showRevisiModal: false });
        this.showNotification(`Revisi berhasil diunggah (${res.data?.version})!`, 'success');
        this.loadDocuments();
        if (this.canViewLogs()) this.loadLogs();
      },
      error: (err: any) => {
        this.updateState({ isSubmittingRevisi: false });
        this.showNotification(err.error?.message || 'Gagal mengunggah revisi.', 'error');
      }
    });
  }

  loadVersions(doc: ArsipItem) {
    this.updateState({ 
      selectedArsip: doc, 
      versionHistory: [], 
      isLoadingVersions: true, 
      showVersionModal: true 
    });

    this.arsipService.getVersions(doc.id).subscribe({
      next: (res: any) => {
        this.updateState({
          isLoadingVersions: false,
          versionHistory: res.data?.history || []
        });
      },
      error: () => {
        this.updateState({ isLoadingVersions: false });
        this.showNotification('Gagal mengambil riwayat revisi.', 'error');
      }
    });
  }

  downloadDocument(doc: ArsipItem) {
    const isDownloading = { ...this.state().isDownloading, [doc.id]: true };
    this.updateState({ isDownloading });
    
    this.arsipService.downloadWatermarked(doc.id).subscribe({
      next: (blob: Blob) => {
        const newIsDownloading = { ...this.state().isDownloading, [doc.id]: false };
        this.updateState({ isDownloading: newIsDownloading });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = doc.file_path.split('.').pop() || 'pdf';
        a.download = `${doc.no_surat.replace(/\//g, '_')}.${ext}`;
        a.click();
        window.URL.revokeObjectURL(url);
        if (this.canViewLogs()) this.loadLogs();
      },
      error: () => {
        const newIsDownloading = { ...this.state().isDownloading, [doc.id]: false };
        this.updateState({ isDownloading: newIsDownloading });
        this.showNotification('Gagal mengunduh berkas dengan dynamic watermark.', 'error');
      }
    });
  }

  deleteArsip(id: number | string, reason: string) {
    this.updateState({ isDeleting: true });
    this.arsipService.deleteArsip(id.toString(), reason).subscribe({
      next: () => {
        this.updateState({ isDeleting: false, showDeleteModal: false });
        this.showNotification('✅ Dokumen telah berhasil dihapus secara aman.', 'success');
        this.loadDocuments();
        if (this.canViewLogs()) this.loadLogs();
      },
      error: (err: any) => {
        this.updateState({ isDeleting: false });
        this.showNotification(err.error?.message || 'Gagal menghapus dokumen.', 'error');
      }
    });
  }

  private updateState(partialState: Partial<ArsipState>) {
    this.state.update(s => ({ ...s, ...partialState }));
  }

  public showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Tutup', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? ['bg-red-600', 'text-white'] : (type === 'success' ? ['bg-green-600', 'text-white'] : [])
    });
  }
}
