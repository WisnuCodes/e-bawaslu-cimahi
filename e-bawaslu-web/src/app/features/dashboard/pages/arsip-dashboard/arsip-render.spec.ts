import { ArsipService } from '../../../../core/services/arsip/arsip.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject } from 'rxjs';
import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ArsipListComponent } from './components/arsip-list/arsip-list.component';
import { ArsipUploadComponent } from './components/arsip-upload/arsip-upload.component';
import { ArsipFacade } from './arsip.facade';

describe('Archive rendering', () => {
  let facade: any;
  beforeEach(() => {
    facade = {
      documents: signal([]), divisiList: signal([{divisi_id: 'd1', nama_divisi: 'P2H'}]),
      searchQuery: signal(''), selectedDivisiFilter: signal(''), selectedYearFilter: signal(''), selectedJenjang: signal(''),
      availableYears: signal([]), canViewLogs: signal(false), showRevisiModal: signal(false),
      showVersionModal: signal(false), showDeleteModal: signal(false), showUploadModal: signal(false),
      uploadError: signal(''), isDownloading: signal({}), isUploading: signal(false),
      authService: {canWriteDocuments: true, canDeleteArsip: true, userRole: 'Kordiv P2H', isSaksiTps: false},
      loadDocuments: () => {}, uploadArsip: jasmine.createSpy('uploadArsip'),
    };
    TestBed.configureTestingModule({imports: [ArsipListComponent, ArsipUploadComponent, BrowserAnimationsModule],
      providers: [{provide: ArsipFacade, useValue: facade}]});
  });
  it('renders document values and paginator after an asynchronous load', fakeAsync(() => {
    const f = TestBed.createComponent(ArsipListComponent);
    f.detectChanges();
    facade.documents.set([{id: 'a1', no_surat: '001/P2H', perihal: 'Laporan pengawasan',
      divisi_id: 'd1', kategori: 'Surat Masuk', klasifikasi: 'Biasa', version: 'v1.0', tgl_surat: '2026-10-06'}]);
    f.detectChanges(); tick(); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('001/P2H');
    expect(f.nativeElement.textContent).toContain('Laporan pengawasan');
    expect(f.componentInstance.paginator.length).toBe(1);
    f.destroy(); flush();
  }));
  it('opens upload form and submits its document', fakeAsync(() => {
    const f = TestBed.createComponent(ArsipUploadComponent);
    f.detectChanges(); facade.showUploadModal.set(true); f.detectChanges(); tick(); f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    f.componentInstance.uploadForm.patchValue({no_surat: '001/P2H', perihal: 'Laporan'});
    facade.divisiList.set([{divisi_id: 'd1', nama_divisi: 'P2H terbaru'}]);
    f.detectChanges();
    expect(f.componentInstance.uploadForm.value.no_surat).toBe('001/P2H');
    f.componentInstance.uploadFile = new File(['%PDF'], 'surat.pdf', {type: 'application/pdf'});
    f.componentInstance.submitUpload();
    expect(facade.uploadArsip).toHaveBeenCalled();
    f.destroy(); flush();
  }));
});

describe('Archive facade integration', () => {
  it('renders asynchronous API rows with the real facade', fakeAsync(() => {
    const response = new Subject<any>();
    TestBed.configureTestingModule({imports: [ArsipListComponent, ArsipUploadComponent, BrowserAnimationsModule], providers: [
      ArsipFacade,
      {provide: ArsipService, useValue: {getArsip: () => response}},
      {provide: MasterDataService, useValue: {getDivisi: () => of({data: []})}},
      {provide: AuthService, useValue: {canWriteDocuments: true, canAccessAuditLog: false, canDeleteArsip: true}},
      {provide: MatSnackBar, useValue: {open: () => {}}},
    ]});
    const f = TestBed.createComponent(ArsipListComponent);
    f.detectChanges();
    response.next({data: [{id: 'a1', no_surat: '001/P2H', perihal: 'Laporan', divisi_id: 'd1',
      kategori: 'Surat Masuk', klasifikasi: 'Biasa', version: 'v1.0', tgl_surat: '2026-10-06'}]});
    f.detectChanges(); tick(); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('001/P2H');
    expect(f.componentInstance.paginator.length).toBe(1);
    f.destroy(); flush();
  }));
});
