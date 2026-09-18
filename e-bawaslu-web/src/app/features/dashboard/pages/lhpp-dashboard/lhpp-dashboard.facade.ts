import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, of, finalize } from 'rxjs';
import { ArsipService, ArsipItem, VersionHistoryItem } from '../../../../core/services/arsip/arsip.service';
import { MasterDataService, Divisi, Tahapan } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class LhppDashboardFacade {
  private arsipService = inject(ArsipService);
  private masterDataService = inject(MasterDataService);
  public authService = inject(AuthService);
  public fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // State Subjects
  private documentsSubject = new BehaviorSubject<ArsipItem[]>([]);
  public documents$ = this.documentsSubject.asObservable();

  private divisiListSubject = new BehaviorSubject<Divisi[]>([]);
  public divisiList$ = this.divisiListSubject.asObservable();

  private tahapanListSubject = new BehaviorSubject<Tahapan[]>([]);
  public tahapanList$ = this.tahapanListSubject.asObservable();

  private arsipLogsSubject = new BehaviorSubject<any[]>([]);
  public arsipLogs$ = this.arsipLogsSubject.asObservable();

  private versionHistorySubject = new BehaviorSubject<VersionHistoryItem[]>([]);
  public versionHistory$ = this.versionHistorySubject.asObservable();

  // Loaders
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isUploading$ = new BehaviorSubject<boolean>(false);
  public isDeleting$ = new BehaviorSubject<boolean>(false);
  public isSubmittingRevisi$ = new BehaviorSubject<boolean>(false);
  public isLoadingTahapan$ = new BehaviorSubject<boolean>(false);
  public isSavingTahapan$ = new BehaviorSubject<boolean>(false);
  public deletingTahapan$ = new BehaviorSubject<boolean>(false);
  public isLoadingVersions$ = new BehaviorSubject<boolean>(false);

  public tahapanLoadError = false;
  public kamar = 'Pemilu';

  // Files
  public uploadFile: File | null = null;
  public revisiFile: File | null = null;
  
  // Downloading Map
  public isDownloading: { [key: string]: boolean } = {};

  // Forms
  public uploadForm = this.fb.group({
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

  public tahapanForm = this.fb.nonNullable.group({
    nama_tahapan: ['', Validators.required],
    divisi_id: ['', Validators.required]
  });

  // Getters
  public get tahapanList() { return this.tahapanListSubject.value; }
  public get divisiList() { return this.divisiListSubject.value; }
  public get versionHistory() { return this.versionHistorySubject.value; }

  // Load Data
  public loadDivisi() {
    this.masterDataService.getDivisi().subscribe({
      next: (res) => this.divisiListSubject.next(res.data || []),
      error: () => this.divisiListSubject.next([])
    });
  }

  public loadTahapan() {
    this.isLoadingTahapan$.next(true);
    this.tahapanLoadError = false;
    this.masterDataService.getTahapan().subscribe({
      next: (res) => {
        this.tahapanListSubject.next(res.data || []);
        this.isLoadingTahapan$.next(false);
      },
      error: () => {
        this.tahapanLoadError = true;
        this.tahapanListSubject.next([]);
        this.isLoadingTahapan$.next(false);
      }
    });
  }

  public loadDocuments() {
    this.isLoading$.next(true);
    this.arsipService.getArsip().subscribe({
      next: (res) => {
        const lhppDocs = (res.data || []).filter((doc: ArsipItem) => 
          ['LHP', 'LHPP'].includes(doc.kategori) && (doc.jenis_pemilihan || 'Pemilu') === this.kamar
        );
        this.documentsSubject.next(lhppDocs);
        this.isLoading$.next(false);
      },
      error: () => {
        this.documentsSubject.next([]);
        this.isLoading$.next(false);
      }
    });
  }

  public loadLogs() {
    if (!this.authService.canAccessAuditLog) return;
    this.arsipService.getArsipLogs().subscribe({
      next: (res) => this.arsipLogsSubject.next(res.data || []),
      error: () => this.arsipLogsSubject.next([])
    });
  }

  public loadVersionHistory(arsipId: string) {
    this.isLoadingVersions$.next(true);
    this.versionHistorySubject.next([]);
    this.arsipService.getVersions(arsipId).subscribe({
      next: (res: any) => {
        this.versionHistorySubject.next(res.data?.history || []);
        this.isLoadingVersions$.next(false);
      },
      error: () => {
        this.isLoadingVersions$.next(false);
      }
    });
  }

  // Tahapan Management
  public saveTahapan(): Observable<boolean> {
    if (this.tahapanForm.invalid) return of(false);
    this.isSavingTahapan$.next(true);
    return new Observable(obs => {
      this.masterDataService.createTahapan(this.tahapanForm.getRawValue()).subscribe({
        next: () => {
          this.showNotification('Tahapan berhasil ditambahkan.', 'success');
          this.loadTahapan();
          this.tahapanForm.reset();
          this.isSavingTahapan$.next(false);
          obs.next(true); obs.complete();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Gagal menyimpan tahapan.', 'error');
          this.isSavingTahapan$.next(false);
          obs.next(false); obs.complete();
        }
      });
    });
  }

  public deleteTahapan(id: string): Observable<boolean> {
    this.deletingTahapan$.next(true);
    return new Observable(obs => {
      this.masterDataService.deleteTahapan(id).subscribe({
        next: () => {
          this.showNotification('Tahapan berhasil dihapus.', 'success');
          this.loadTahapan();
          this.deletingTahapan$.next(false);
          obs.next(true); obs.complete();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Gagal menghapus tahapan. Mungkin sedang digunakan.', 'error');
          this.deletingTahapan$.next(false);
          obs.next(false); obs.complete();
        }
      });
    });
  }

  // Upload Arsip
  public submitUpload(): Observable<boolean> {
    if (this.uploadForm.invalid || !this.uploadFile) {
      this.showNotification('Mohon lengkapi form dan file dokumen.', 'error');
      return of(false);
    }
    this.isUploading$.next(true);
    const formData = new FormData();
    formData.append('divisi_id', this.uploadForm.value.divisi_id!);
    formData.append('no_surat', this.uploadForm.value.no_surat!);
    formData.append('tgl_surat', this.uploadForm.value.tgl_surat!);
    formData.append('perihal', this.uploadForm.value.perihal!);
    formData.append('kategori', 'LHP');
    formData.append('jenis_pemilihan', this.kamar);
    formData.append('tahapan_id', this.uploadForm.value.tahapan_id!);
    formData.append('klasifikasi', this.uploadForm.value.klasifikasi!);
    
    ['kejadian_1', 'kejadian_2', 'kejadian_3'].map(key => (this.uploadForm.value[key as keyof typeof this.uploadForm.value] || '').trim())
      .filter(Boolean)
      .forEach((note, index) => formData.append(`catatan_kejadian[${index}]`, note));
    
    formData.append('kondisi_kotak_surat', (this.uploadForm.value.kondisi_kotak_surat || '').trim());
    formData.append('file_dokumen', this.uploadFile);

    return new Observable<boolean>(obs => {
      this.arsipService.uploadArsip(formData).pipe(
        finalize(() => this.isUploading$.next(false))
      ).subscribe({
        next: (res) => {
          this.showNotification(res.message || 'LHP berhasil diunggah.', 'success');
          this.loadDocuments();
          this.loadLogs();
          obs.next(true); obs.complete();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Gagal mengunggah arsip.', 'error');
          obs.next(false); obs.complete();
        }
      });
    });
  }

  // Revisi
  public submitRevisi(id: string, catatan: string): Observable<boolean> {
    if (!this.revisiFile || !catatan.trim()) return of(false);
    this.isSubmittingRevisi$.next(true);
    
    const formData = new FormData();
    formData.append('file_dokumen', this.revisiFile);
    formData.append('catatan_revisi', catatan);

    return new Observable(obs => {
      this.arsipService.uploadRevisi(id, formData).subscribe({
        next: () => {
          this.showNotification('Revisi dokumen berhasil diunggah.', 'success');
          this.loadDocuments();
          this.loadLogs();
          this.isSubmittingRevisi$.next(false);
          obs.next(true); obs.complete();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Gagal mengunggah revisi.', 'error');
          this.isSubmittingRevisi$.next(false);
          obs.next(false); obs.complete();
        }
      });
    });
  }

  // Delete
  public deleteArsip(id: string, deleteReason: string): Observable<boolean> {
    this.isDeleting$.next(true);
    return new Observable<boolean>(obs => {
      this.arsipService.deleteArsip(id, deleteReason).subscribe({
        next: () => {
          this.showNotification('✅ Dokumen telah berhasil dihapus.', 'success');
          this.loadDocuments();
          this.loadLogs();
          this.isDeleting$.next(false);
          obs.next(true); obs.complete();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Gagal menghapus dokumen.', 'error');
          this.isDeleting$.next(false);
          obs.next(false); obs.complete();
        }
      });
    });
  }

  // Download
  public downloadDocument(doc: ArsipItem) {
    this.isDownloading[doc.id] = true;
    this.arsipService.downloadWatermarked(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const ext = doc.file_path.split('.').pop()?.toLowerCase();
        link.download = `LHP_${doc.no_surat.replace(/\//g, '_')}_${doc.version || 'v1.0'}.${ext}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading[doc.id] = false;
        this.loadLogs(); // refresh log for download action
      },
      error: () => {
        this.showNotification('Gagal mengunduh dokumen.', 'error');
        this.isDownloading[doc.id] = false;
      }
    });
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
