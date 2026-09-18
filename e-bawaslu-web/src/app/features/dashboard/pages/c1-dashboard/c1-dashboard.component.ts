import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, map, startWith } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { C1DashboardFacade, C1State } from './c1-dashboard.facade';
import { MasterDataService } from '../../../../core/services/master-data.service';

import { C1FilterComponent } from './components/c1-filter/c1-filter.component';
import { C1KpiCardsComponent } from './components/c1-kpi-cards/c1-kpi-cards.component';
import { C1UploadFormComponent } from './components/c1-upload-form/c1-upload-form.component';
import { C1DataTableComponent } from './components/c1-data-table/c1-data-table.component';
import { ConfirmDialogComponent } from '../../../../shared/components/molecules/confirm-dialog/confirm-dialog.component';
import { C1Item } from '../../../../core/services/c1/c1.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-c1-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonToggleModule,
    FormsModule,
    MatDialogModule,
    C1FilterComponent,
    C1KpiCardsComponent,
    C1UploadFormComponent,
    C1DataTableComponent
  ],
  providers: [C1DashboardFacade],
  templateUrl: './c1-dashboard.component.html',
  styleUrls: ['./c1-dashboard.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class C1DashboardComponent implements OnInit, OnDestroy {
  public facade = inject(C1DashboardFacade);
  private masterDataService = inject(MasterDataService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // State
  state = signal<C1State>(this.facade.currentState);
  kecamatanList = signal<string[]>([]);
  kelurahanList = signal<string[]>([]);
  savingApproval = signal<Record<string, boolean>>({});

  // Computed Values
  filteredTps = computed(() => {
    let tps = this.state().tpsList;
    if (this.state().selectedKecamatan) {
      tps = tps.filter(t => t.kecamatan === this.state().selectedKecamatan);
    }
    if (this.state().selectedKelurahan) {
      tps = tps.filter(t => t.kelurahan === this.state().selectedKelurahan);
    }
    return tps;
  });

  canWriteDocuments = computed(() => {
    const role = this.facade.authService.userRole;
    return ['superadmin', 'admin_kota', 'admin_kecamatan', 'ptps'].includes(role);
  });

  canDeleteC1 = computed(() => {
    return this.facade.authService.userRole === 'superadmin';
  });

  isSuperAdmin = computed(() => {
    return this.facade.authService.userRole === 'superadmin';
  });

  isPimpinan = computed(() => {
    const role = this.facade.authService.userRole;
    return role === 'pimpinan' || role === 'ketua_bawaslu' || role === 'anggota_bawaslu';
  });

  isKadivP2H = computed(() => {
    return this.facade.authService.userRole === 'kadiv_p2h';
  });

  currentUserDivisiId = computed(() => {
    const u = this.facade.authService.currentUser();
    return u?.divisi_id || null;
  });

  currentUserRole = computed(() => {
    return this.facade.authService.userRole;
  });

  totalTpsPilot = computed(() => this.state().tpsList.length);
  c1ListLength = computed(() => this.state().c1List.length);
  progressPercentage = computed(() => {
    const total = this.totalTpsPilot();
    return total === 0 ? 0 : Math.round((this.c1ListLength() / total) * 100);
  });

  verifiedProgressPercentage = computed(() => {
    const total = this.totalTpsPilot();
    if (total === 0) return 0;
    const verified = this.state().c1List.filter(c => c.status_c1 === 'Approved').length;
    return Math.round((verified / total) * 100);
  });

  totalSuaraSahKota = computed(() => {
    return this.state().c1List.reduce((acc, curr) => acc + (Number(curr.total_suara_sah) || 0), 0);
  });

  totalSuaraTidakSahKota = computed(() => {
    return this.state().c1List.reduce((acc, curr) => acc + (Number(curr.total_suara_tidak_sah) || 0), 0);
  });

  totalPemilihKota = computed(() => {
    return this.state().c1List.reduce((acc, curr) => acc + (Number(curr.total_pemilih) || 0), 0);
  });

  totalMismatchCount = computed(() => {
    return this.state().c1List.filter(c => c.status_c1 === 'Mismatch').length;
  });

  totalSuaraPaslonKota = computed(() => {
    const totalByPaslon: Record<string, number> = {};
    this.state().c1List.forEach(c => {
      if (c.suara_paslon) {
        let pData: any = {};
        if (typeof c.suara_paslon === 'string') {
          try { pData = JSON.parse(c.suara_paslon); } catch(e) { }
        } else {
          pData = c.suara_paslon;
        }
        Object.keys(pData).forEach(k => {
          totalByPaslon[k] = (totalByPaslon[k] || 0) + (Number(pData[k]) || 0);
        });
      }
    });
    return Object.keys(totalByPaslon).map(key => ({ key, val: totalByPaslon[key] }));
  });

  ngOnInit() {
    this.facade.state$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.state.set(state);
    });

    // Populate kecamatan list from TPS list
    this.facade.state$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      const kec = Array.from(new Set(state.tpsList.map(t => t.kecamatan).filter(Boolean)));
      this.kecamatanList.set(kec.sort());
    });
    
    this.facade.loadInitialData();
    this.facade.loadC1List();

    this.facade.c1Form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Force trigger change detection on inputs
      this.state.set({ ...this.facade.currentState });
    });

    // Listen to route query params to switch kamar based on sidebar navigation
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const kamar = params['kamar'];
      if (kamar && kamar !== this.state().kamar) {
        this.facade.setKamar(kamar);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onKecamatanChange(val: string) {
    this.facade.updateState({ selectedKecamatan: val });
    if (val) {
      const kels = Array.from(new Set(this.state().tpsList.filter(t => t.kecamatan === val).map(t => t.kelurahan).filter(Boolean)));
      this.kelurahanList.set(kels.sort());
    } else {
      this.kelurahanList.set([]);
    }
  }

  onKelurahanChange(val: string) {
    this.facade.updateState({ selectedKelurahan: val });
  }

  onRegionChange(isKecamatan: boolean) {
    this.facade.changeRegion(isKecamatan);
  }

  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];
    if (file) {
      this.facade.updateState({ selectedFile: file });
      this.facade.runBackendOcr(file);
    }
  }

  get sumSuaraPaslon(): number {
    const values = this.facade.c1Form.value.suara_paslon || [];
    return values.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
  }

  get isMismatch(): boolean {
    const val = this.facade.c1Form.value;
    const mathTotal = Number(val.total_suara_sah || 0) + Number(val.total_suara_tidak_sah || 0);
    return mathTotal !== Number(val.total_pemilih || 0) && Number(val.total_pemilih || 0) > 0;
  }

  get totalSuaraMasukForm(): number {
    const val = this.facade.c1Form.value;
    return Number(val.total_suara_sah || 0) + Number(val.total_suara_tidak_sah || 0);
  }

  onApprove(event: {item: C1Item, status: 'Approved' | 'Rejected' | 'Revision'}) {
    const label = event.status === 'Approved' ? 'Menyetujui (Approved)' : (event.status === 'Rejected' ? 'Menolak (Rejected)' : 'Meminta Revisi');
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Konfirmasi ${event.status}`,
        message: `Apakah Anda yakin ingin ${label} berkas Form C1 ini?`,
        confirmText: 'Ya, Lanjutkan'
      },
      width: '400px',
      panelClass: 'premium-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.facade.approveC1(event.item.id, event.status);
      }
    });
  }

  onDelete(c1: C1Item) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Hapus Permanen',
        message: 'PERINGATAN: Apakah Anda yakin ingin menghapus data Form C1 ini secara permanen? Aksi ini tidak dapat dibatalkan.',
        confirmText: 'Ya, Hapus'
      },
      width: '400px',
      panelClass: 'premium-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.facade.deleteC1(c1.id);
      }
    });
  }

  onAssignApproval(event: {item: C1Item, division: string}) {
    this.savingApproval.update(prev => ({...prev, [event.item.id]: true}));
    this.facade.assignApproval(event.item.id, event.division).subscribe({
      next: () => {
        this.savingApproval.update(prev => ({...prev, [event.item.id]: false}));
        this.facade.showNotification('Divisi approval berhasil ditugaskan.', 'success');
      },
      error: () => {
        this.savingApproval.update(prev => ({...prev, [event.item.id]: false}));
        this.facade.showNotification('Gagal menugaskan divisi approval.', 'error');
      }
    });
  }

  copyHash(hash: string) {
    navigator.clipboard.writeText(hash);
    this.facade.showNotification('SHA-256 Hash disalin ke clipboard!', 'success');
  }
}

