import { A11yModule } from '@angular/cdk/a11y';
import { Component, inject, ViewChild, ElementRef, OnInit, effect, OnDestroy, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { ArsipFacade } from '../../arsip.facade';
import { ArsipItem } from '../../../../../../core/services/arsip/arsip.service';
import { FilePreviewComponent } from '../../../../../../shared/components/molecules/file-preview/file-preview.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-arsip-list',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
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
    MatProgressSpinnerModule,
    MatPaginatorModule,
    FilePreviewComponent
  ],
  templateUrl: './arsip-list.component.html',
  styleUrls: ['../../arsip-modal.shared.css', './arsip-list.component.css']
})
export class ArsipListComponent implements OnInit, OnDestroy {
  public facade = inject(ArsipFacade);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('revisiFileInput') revisiFileInput!: ElementRef<HTMLInputElement>;

  dataSource = new MatTableDataSource<ArsipItem>([]);
  displayedColumns: string[] = ['no_surat', 'perihal', 'kategori', 'klasifikasi', 'versi', 'tanggal', 'aksi'];

  // Local state for modals
  revisiCatatan: string = '';
  revisiFile: File | null = null;
  deleteReason: string = '';

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor() {
    effect(() => {
      const documents = this.facade.documents();
      const query = this.facade.searchQuery();
      // Material creates row views and updates internal signals synchronously.
      // Keep that work outside the reactive effect's tracking context.
      untracked(() => {
        this.dataSource.data = documents;
        this.dataSource.filter = query.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
      });
    });
  }

  ngOnInit(): void {
    this.facade.loadDocuments();
    if (this.facade.canViewLogs()) {
      this.facade.loadLogs();
    }

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(filterValue => {
      this.facade.setFilter('searchQuery', filterValue);
      this.dataSource.filter = filterValue.trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  onSearchInput(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  getDivisiName(divisiId: string): string {
    const found = this.facade.divisiList().find(d => d.divisi_id === divisiId);
    return found ? found.nama_divisi : '-';
  }

  // Revisi
  openRevisiModal(doc: ArsipItem) {
    this.facade.setSelectedArsip(doc);
    this.revisiCatatan = '';
    this.revisiFile = null;
    this.facade.setModal('showRevisiModal', true);
  }

  onRevisiFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.revisiFile = event.target.files[0];
    }
  }

  submitRevisi() {
    if (!this.revisiFile || !this.revisiCatatan.trim()) {
      this.facade.showNotification('Mohon pilih berkas revisi dan berikan catatan alasan revisi.', 'error');
      return;
    }
    const doc = this.facade.selectedArsip();
    if (doc) {
      const formData = new FormData();
      formData.append('file_dokumen', this.revisiFile);
      formData.append('catatan_revisi', this.revisiCatatan);
      this.facade.uploadRevisi(doc.id, formData);
    }
  }

  // Soft Delete
  openDeleteModal(doc: ArsipItem) {
    this.facade.setSelectedArsip(doc);
    this.deleteReason = '';
    this.facade.setModal('showDeleteModal', true);
  }

  submitDelete() {
    if (this.deleteReason.trim().length < 10) {
      this.facade.showNotification('Alasan wajib diisi minimal 10 karakter untuk Audit Trail.', 'error');
      return;
    }
    const doc = this.facade.selectedArsip();
    if (doc) {
      this.facade.deleteArsip(doc.id, this.deleteReason);
    }
  }
}
