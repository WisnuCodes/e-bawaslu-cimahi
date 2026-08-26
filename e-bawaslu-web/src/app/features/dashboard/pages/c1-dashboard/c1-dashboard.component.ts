import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { C1Service, C1Item } from '../../../../core/services/c1/c1.service';
import { MasterDataService, WilayahTps } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import * as Tesseract from 'tesseract.js';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { Inject, ViewChild } from '@angular/core';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import * as _ from 'lodash';

// Komponen Inline untuk Dialog Konfirmasi Profesional
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div style="padding: 32px 24px; text-align: center; font-family: 'Inter', sans-serif;">
      <div style="
        width: 64px; 
        height: 64px; 
        border-radius: 50%; 
        background-color: #fee2e2; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        margin: 0 auto 20px;
        box-shadow: 0 0 0 8px #fef2f2;
      ">
        <mat-icon style="color: #ef4444; font-size: 32px; width: 32px; height: 32px;">warning_amber</mat-icon>
      </div>
      
      <h2 style="margin: 0 0 12px; font-size: 1.25rem; font-weight: 700; color: #0f172a; letter-spacing: -0.025em;">
        {{ data.title }}
      </h2>
      
      <p style="margin: 0 0 32px; color: #475569; font-size: 0.95rem; line-height: 1.6; padding: 0 16px;">
        {{ data.message }}
      </p>
      
      <div style="display: flex; gap: 16px; justify-content: center; padding: 0 16px;">
        <button mat-flat-button (click)="dialogRef.close(false)" style="flex: 1; background-color: #f1f5f9; color: #475569; font-weight: 600; padding: 6px 0; border-radius: 8px;">
          Batal
        </button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)" style="flex: 1; font-weight: 600; padding: 6px 0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">
          {{ data.confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      border-radius: 16px;
      overflow: hidden;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string, confirmText: string }
  ) {}
}

@Component({
  selector: 'app-c1-dashboard',
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
    DateFormatPipe,
    MatPaginatorModule
  ],
  templateUrl: './c1-dashboard.component.html',
  styleUrl: './c1-dashboard.component.css'
})
export class C1DashboardComponent implements OnInit {
  private c1Service = inject(C1Service);
  private masterDataService = inject(MasterDataService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  
  tpsList: WilayahTps[] = [];
  selectedFilterTps: string = '';
  c1List = new MatTableDataSource<C1Item>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  applyFilterC1 = _.debounce((event: Event) => {
    const filterValue = (event.target as HTMLInputElement).value;
    this.c1List.filter = filterValue.trim().toLowerCase();
    if (this.c1List.paginator) {
      this.c1List.paginator.firstPage();
    }
  }, 300);

  displayedColumns: string[] = ['tps', 'suara_sah', 'rincian_paslon', 'suara_tidak_sah', 'total_pemilih', 'hash', 'status', 'tanggal', 'aksi'];
  
  isUploading = false;
  isOcrScanning = false;
  ocrProgress = 0;
  ocrStatusText = '';
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  editingC1Id: string | null = null;

  c1Form: FormGroup = this.fb.group({
    tps_id: ['', Validators.required],
    jumlah_paslon: [2, Validators.required], // Default 2 paslon
    suara_paslon: this.fb.array([
      this.fb.control(0, [Validators.required, Validators.min(0)]), // Paslon 1
      this.fb.control(0, [Validators.required, Validators.min(0)])  // Paslon 2
    ]),
    total_suara_sah: [0, [Validators.required, Validators.min(0)]],
    total_suara_tidak_sah: [0, [Validators.required, Validators.min(0)]],
    total_pemilih: [0, [Validators.required, Validators.min(0)]]
  });

  get suaraPaslonControls() {
    return (this.c1Form.get('suara_paslon') as FormArray).controls;
  }

  onJumlahPaslonChange(jumlah: number) {
    const arr = this.c1Form.get('suara_paslon') as FormArray;
    arr.clear();
    for (let i = 0; i < jumlah; i++) {
      arr.push(this.fb.control(0, [Validators.required, Validators.min(0)]));
    }
  }

  get isStaf(): boolean {
    return this.authService.isStaf;
  }

  get isKepalaDivisi(): boolean {
    return this.authService.isKepalaDivisi;
  }

  get isPimpinan(): boolean {
    return this.authService.isPimpinan || this.authService.isSuperAdmin;
  }

  get canApprove(): boolean {
    return this.authService.canApprove;
  }

  get canDeleteC1(): boolean {
    return this.authService.canDeleteC1;
  }

  get isMismatch(): boolean {
    const sah = Number(this.c1Form.value.total_suara_sah) || 0;
    const tidakSah = Number(this.c1Form.value.total_suara_tidak_sah) || 0;
    const total = Number(this.c1Form.value.total_pemilih) || 0;
    return (sah + tidakSah) !== total;
  }

  getPaslonBreakdown(c1: C1Item): { key: string, val: number }[] {
    if (!c1.suara_paslon) return [];
    let paslonData: Record<string, number> | null = null;
    if (typeof c1.suara_paslon === 'string') {
      try { paslonData = JSON.parse(c1.suara_paslon); } catch(e) { paslonData = null; }
    } else {
      paslonData = c1.suara_paslon;
    }

    if (!paslonData) return [];
    
    const result: { key: string, val: number }[] = [];
    Object.keys(paslonData).forEach(key => {
      result.push({ key: key, val: paslonData![key] });
    });
    return result;
  }

  get totalSuaraMasukForm(): number {
    const sah = Number(this.c1Form.value.total_suara_sah) || 0;
    const tidakSah = Number(this.c1Form.value.total_suara_tidak_sah) || 0;
    return sah + tidakSah;
  }

  // ========================================================
  // FR-REC-01: AGREGASI BERJENJANG (KOTA & KECAMATAN)
  // ========================================================
  get totalSuaraSahKota(): number {
    return this.c1List.data.reduce((acc, curr) => acc + (Number(curr.total_suara_sah) || 0), 0);
  }

  get totalSuaraPaslonKota(): { key: string, val: number }[] {
    const totals: Record<string, number> = {};
    
    this.c1List.data.forEach(c1 => {
      if (c1.suara_paslon) {
        let paslonData: Record<string, number> | null = null;
        if (typeof c1.suara_paslon === 'string') {
          try { paslonData = JSON.parse(c1.suara_paslon); } catch(e) { paslonData = null; }
        } else {
          paslonData = c1.suara_paslon;
        }

        if (paslonData) {
          Object.keys(paslonData).forEach(key => {
            if (!totals[key]) totals[key] = 0;
            totals[key] += Number(paslonData![key]) || 0;
          });
        }
      }
    });

    const result = Object.keys(totals).map(key => ({
      key: key,
      val: totals[key]
    }));
    
    return result.sort((a, b) => parseInt(a.key) - parseInt(b.key));
  }

  get totalSuaraTidakSahKota(): number {
    return this.c1List.data.reduce((acc, curr) => acc + (Number(curr.total_suara_tidak_sah) || 0), 0);
  }

  get totalPemilihKota(): number {
    return this.c1List.data.reduce((acc, curr) => acc + (Number(curr.total_pemilih) || 0), 0);
  }

  get totalMismatchCount(): number {
    return this.c1List.data.filter(c => c.status_c1 === 'Mismatch').length;
  }

  // ========================================================
  // FR-REC-03: LIVE PROGRESS BAR
  // ========================================================
  get totalTpsPilot(): number {
    return this.tpsList.length > 0 ? this.tpsList.length : 15;
  }

  get progressPercentage(): number {
    if (this.totalTpsPilot === 0) return 0;
    const pct = Math.round((this.c1List.data.length / this.totalTpsPilot) * 100);
    return Math.min(100, pct);
  }

  get verifiedProgressPercentage(): number {
    if (this.totalTpsPilot === 0) return 0;
    const approvedCount = this.c1List.data.filter((c: any) => c.status_c1 === 'Approved').length;
    return Math.min(100, Math.round((approvedCount / this.totalTpsPilot) * 100));
  }

  ngOnInit() {
    if (!this.authService.canAccessC1) {
      this.showNotification('Akses Ditolak: Anda tidak memiliki wewenang (Hak Akses C1).', 'error');
      this.router.navigate(['/dashboard']);
      return;
    }
    
    this.loadTps();
    this.loadC1List();
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
        if (this.tpsList.length > 0 && !this.c1Form.value.tps_id) {
          this.c1Form.patchValue({ tps_id: this.tpsList[0].tps_id });
        }
      },
      error: () => this.tpsList = []
    });
  }

  loadC1List() {
    this.c1Service.getC1List(this.selectedFilterTps).subscribe({
      next: (res) => {
        this.c1List.data = res.data || [];
        this.c1List.paginator = this.paginator;
      },
      error: (err) => {
        console.error('Failed to load C1 list', err);
        this.c1List.data = [];
      }
    });
  }

  onFilterTpsChange(tpsId: string) {
    this.selectedFilterTps = tpsId;
    this.loadC1List();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] || null;
    this.selectedFile = file;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Mulai proses OCR otomatis
      this.runOcrEngine(file);

    } else {
      this.imagePreviewUrl = null;
      this.c1Form.patchValue({ total_suara_sah: 0, total_suara_tidak_sah: 0, total_pemilih: 0 });
    }
  }

  async runOcrEngine(file: File) {
    if (!file.type.startsWith('image/')) {
       return;
    }
    
    this.isOcrScanning = true;
    this.ocrProgress = 0;
    this.ocrStatusText = 'Memulai mesin OCR AI...';

    try {
      const worker = await Tesseract.createWorker('eng+ind', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            this.ocrProgress = Math.round(m.progress * 100);
            this.ocrStatusText = `Mengekstrak data form (${this.ocrProgress}%)...`;
          } else {
            this.ocrStatusText = m.status;
          }
        }
      });
      
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log('=== OCR RAW TEXT ===');
      console.log(text);
      console.log('===================');

      this.isOcrScanning = false;

      // ==================================================================
      // ALGORITMA OCR CERDAS UNTUK FORM C1 PEMILU
      // ==================================================================
      // Form C1 menulis angka di KOTAK TERPISAH per digit.
      // Contoh: angka 176 ditulis sebagai |1|7|6| dalam 3 kotak.
      // Tesseract membaca ini sebagai "1 7 6" atau "1  7  6" (digit terpisah spasi).
      // Kita perlu merekonstruksi angka-angka multi-digit ini.
      // ==================================================================

      const allNumbers: number[] = [];

      // TAHAP 1: Ambil angka yang sudah terbaca utuh
      const directNumbers = text.match(/\b\d{2,4}\b/g)?.map(Number) || [];
      allNumbers.push(...directNumbers);

      // TAHAP 2: Rekonstruksi angka dari digit terpisah per baris
      // Mencari pola: satu atau lebih digit yang dipisah oleh spasi/karakter non-digit
      const lines = text.split('\n');
      for (const line of lines) {
        // Cari grup digit yang dipisah spasi (pola kotak C1)
        // Contoh: "1 7 6" → 176, "0 7 5" → 75, "0 0 3" → 3
        const matches = line.match(/(?:\d\s+){1,}\d/g);
        if (matches) {
          for (const match of matches) {
            const digits = match.replace(/\s+/g, '');
            if (digits.length >= 2 && digits.length <= 4) {
              const num = parseInt(digits, 10);
              if (num >= 0 && num <= 1000) {
                allNumbers.push(num);
              }
            }
          }
        }

        // Juga cari angka individual di akhir baris (sering muncul di kolom JUMLAH)
        const trailingNum = line.trim().match(/(\d{2,3})\s*$/);
        if (trailingNum) {
          allNumbers.push(parseInt(trailingNum[1], 10));
        }
      }

      // TAHAP 3: Juga ambil semua angka satu digit (berguna untuk suara tidak sah yang kecil)
      const singleDigits = text.match(/\b\d\b/g)?.map(Number) || [];
      allNumbers.push(...singleDigits);

      // Deduplikasi dan filter angka wajar
      const uniqueNums = [...new Set(allNumbers)].filter(n => n >= 0 && n <= 1000);
      const numSet = new Set(uniqueNums);
      const count = this.c1Form.value.jumlah_paslon;

      console.log('OCR Extracted unique numbers:', uniqueNums);

      let foundMatch = false;
      let bestPaslon: number[] = [];
      let bestSah = 0;
      let bestTidakSah = 0;
      let bestTotal = 0;
      let bestScore = 0; // Skor prioritas: angka yang lebih besar = lebih mungkin benar

      // TAHAP 4: PENCARIAN CERDAS
      // Urutkan dari besar ke kecil (angka terbesar biasanya Total Pemilih)
      const sorted = uniqueNums.sort((a, b) => b - a);

      for (const total of sorted) {
        if (total < 2) continue; // Total minimal harus > 1
        
        for (const sah of sorted) {
          if (sah >= total || sah < 1) continue;
          const tidakSah = total - sah;
          
          // Cek apakah tidakSah juga ada di daftar angka yang terbaca
          if (tidakSah >= 0 && numSet.has(tidakSah)) {
            
            // Cocok! Sekarang cari paslon
            if (count === 2) {
              for (const p1 of sorted) {
                if (p1 > sah || p1 < 1) continue;
                const p2 = sah - p1;
                if (p2 >= 0 && numSet.has(p2) && p2 !== p1) {
                  // Pastikan ini kombinasi yang masuk akal
                  const score = total + sah; // Prioritaskan angka besar
                  if (score > bestScore) {
                    bestPaslon = [p1, p2];
                    bestSah = sah;
                    bestTidakSah = tidakSah;
                    bestTotal = total;
                    bestScore = score;
                    foundMatch = true;
                  }
                  break; // Cukup satu match per kombinasi sah/total
                }
              }
            } else if (count === 3) {
              for (const p1 of sorted) {
                if (p1 > sah || p1 < 1) continue;
                for (const p2 of sorted) {
                  if (p2 > sah - p1) continue;
                  const p3 = sah - p1 - p2;
                  if (p3 >= 0 && numSet.has(p3)) {
                    const score = total + sah;
                    if (score > bestScore) {
                      bestPaslon = [p1, p2, p3];
                      bestSah = sah;
                      bestTidakSah = tidakSah;
                      bestTotal = total;
                      bestScore = score;
                      foundMatch = true;
                    }
                    break;
                  }
                }
                if (foundMatch && bestScore > 100) break; // Cukup yakin
              }
            }
          }
          if (foundMatch && bestScore > 100) break;
        }
        if (foundMatch && bestScore > 100) break;
      }

      const arr = this.c1Form.get('suara_paslon') as FormArray;

      if (foundMatch) {
        for (let i = 0; i < count; i++) {
          arr.at(i).setValue(bestPaslon[i]);
        }
        
        this.c1Form.patchValue({
          total_suara_sah: bestSah,
          total_suara_tidak_sah: bestTidakSah,
          total_pemilih: bestTotal
        });

        this.showNotification(
          `OCR Berhasil! Paslon: ${bestPaslon.join(' + ')} = ${bestSah} (Sah), Tidak Sah: ${bestTidakSah}, Total: ${bestTotal}. Mohon verifikasi.`, 
          'success'
        );
      } else if (sorted.length >= 2) {
        // Fallback: Gunakan angka-angka terbesar yang ditemukan
        const approxTotal = sorted[0];
        const approxSah = sorted[1];
        const approxTidakSah = Math.max(0, approxTotal - approxSah);
        
        let sisa = approxSah;
        for (let i = 0; i < count; i++) {
          if (i === count - 1) {
            arr.at(i).setValue(Math.max(0, sisa));
          } else {
            const share = Math.floor(sisa / (count - i));
            arr.at(i).setValue(share);
            sisa -= share;
          }
        }

        this.c1Form.patchValue({
          total_suara_sah: approxSah,
          total_suara_tidak_sah: approxTidakSah,
          total_pemilih: approxTotal
        });

        this.showNotification(
          `OCR Parsial: Angka terbesar terbaca ${approxTotal} dan ${approxSah}. Mohon periksa dan koreksi manual!`, 
          'error'
        );
      } else {
        this.showNotification('OCR Gagal: Tidak ada angka yang cukup terbaca dari gambar. Silakan input manual.', 'error');
      }
    } catch (err) {
      console.error(err);
      this.isOcrScanning = false;
      this.showNotification('Mesin OCR gagal memproses gambar.', 'error');
    }
  }

  onSubmit() {
    if (this.c1Form.invalid) {
      this.showNotification('Mohon lengkapi formulir dengan benar.', 'error');
      return;
    }
    
    if (!this.editingC1Id && !this.selectedFile) {
      this.showNotification('Mohon pilih foto form C1 untuk diunggah.', 'error');
      return;
    }

    this.isUploading = true;
    const paslonValues = this.c1Form.value.suara_paslon;
    const paslonObj: Record<string, number> = {};
    paslonValues.forEach((val: number, idx: number) => {
      paslonObj[idx + 1] = val;
    });

    if (this.editingC1Id) {
      // PROSES EDIT
      const updateData = {
        tps_id: this.c1Form.value.tps_id,
        suara_paslon: JSON.stringify(paslonObj),
        total_suara_sah: this.c1Form.value.total_suara_sah,
        total_suara_tidak_sah: this.c1Form.value.total_suara_tidak_sah,
        total_pemilih: this.c1Form.value.total_pemilih
      };

      this.c1Service.updateC1(this.editingC1Id, updateData).subscribe({
        next: (res) => {
          this.isUploading = false;
          this.showNotification('Data C1 berhasil diperbarui.', 'success');
          this.resetForm();
          this.loadC1List();
        },
        error: (err) => {
          this.isUploading = false;
          this.showNotification(err.error?.message || 'Gagal memperbarui C1.', 'error');
        }
      });
    } else {
      // PROSES CREATE
      const formData = new FormData();
      formData.append('tps_id', this.c1Form.value.tps_id);
      formData.append('suara_paslon', JSON.stringify(paslonObj));
      formData.append('total_suara_sah', this.c1Form.value.total_suara_sah);
      formData.append('total_suara_tidak_sah', this.c1Form.value.total_suara_tidak_sah);
      formData.append('total_pemilih', this.c1Form.value.total_pemilih);
      formData.append('file_c1', this.selectedFile!);

      this.c1Service.uploadC1(formData).subscribe({
        next: (res) => {
          this.isUploading = false;
          this.showNotification('Form C1 berhasil dienkripsi dan disimpan.', 'success');
          this.resetForm();
          this.loadC1List();
        },
        error: (err) => {
          this.isUploading = false;
          if (err.status === 409) {
            this.showNotification('DUPLIKASI TERDETEKSI: Berkas C1 ini memiliki hash SHA-256 yang identik dengan server!', 'error');
          } else {
            this.showNotification(err.error?.message || 'Gagal mengunggah Form C1.', 'error');
          }
        }
      });
    }
  }

  resetForm() {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.editingC1Id = null;
    const currentJumlah = this.c1Form.value.jumlah_paslon;
    this.c1Form.reset({
      tps_id: this.tpsList.length > 0 ? this.tpsList[0].tps_id : '',
      jumlah_paslon: currentJumlah,
      total_suara_sah: 0,
      total_suara_tidak_sah: 0,
      total_pemilih: 0
    });
    this.onJumlahPaslonChange(currentJumlah);
  }

  onEdit(c1: C1Item) {
    this.editingC1Id = c1.id;
    
    // Parse suara_paslon - bisa berupa string JSON, objek, atau null
    let paslonData: Record<string, number> | null = null;
    if (c1.suara_paslon) {
      if (typeof c1.suara_paslon === 'string') {
        try { paslonData = JSON.parse(c1.suara_paslon); } catch(e) { paslonData = null; }
      } else {
        paslonData = c1.suara_paslon;
      }
    }

    let jumlahPaslon = 2;
    if (paslonData) {
      const keys = Object.keys(paslonData);
      if (keys.length >= 2) jumlahPaslon = keys.length;
    }

    this.onJumlahPaslonChange(jumlahPaslon);
    
    const arr = this.c1Form.get('suara_paslon') as FormArray;
    let sumPaslon = 0;
    if (paslonData) {
      Object.values(paslonData).forEach(v => sumPaslon += Number(v) || 0);
    }

    if (paslonData && sumPaslon > 0) {
      for (let i = 0; i < jumlahPaslon; i++) {
        const val = paslonData[(i + 1).toString()] || paslonData[i.toString()] || 0;
        arr.at(i)?.setValue(val);
      }
    } else {
      // Jika data paslon belum pernah disimpan (null) atau nilainya masih default (0, 0)
      const sah = Number(c1.total_suara_sah) || 0;
      let sisa = sah;
      for (let i = 0; i < jumlahPaslon; i++) {
        if (i === jumlahPaslon - 1) {
          arr.at(i)?.setValue(sisa);
        } else {
          const share = Math.floor(sisa / (jumlahPaslon - i));
          arr.at(i)?.setValue(share);
          sisa -= share;
        }
      }
    }

    this.c1Form.patchValue({
      tps_id: c1.tps_id,
      jumlah_paslon: jumlahPaslon,
      total_suara_sah: c1.total_suara_sah,
      total_suara_tidak_sah: c1.total_suara_tidak_sah,
      total_pemilih: c1.total_pemilih
    });
    
    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showNotification('Mode Edit diaktifkan. Silakan perbaiki angka di atas lalu klik "Perbarui Data C1".', 'info');
  }

  onApprove(c1: C1Item, status: 'Approved' | 'Rejected' | 'Revision') {
    const label = status === 'Approved' ? 'Menyetujui (Approved)' : (status === 'Rejected' ? 'Menolak (Rejected)' : 'Meminta Revisi');
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Konfirmasi ${status}`,
        message: `Apakah Anda yakin ingin ${label} berkas Form C1 ini?`,
        confirmText: 'Ya, Lanjutkan'
      },
      width: '400px',
      panelClass: 'premium-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.c1Service.approveC1(c1.id, status).subscribe({
          next: (res) => {
            this.showNotification(res.message || `Status C1 berhasil diubah menjadi ${status}`, 'success');
            this.loadC1List();
          },
          error: (err) => this.showNotification(err.error?.message || 'Gagal mengubah status.', 'error')
        });
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
        this.c1Service.deleteC1(c1.id).subscribe({
          next: (res) => {
            this.showNotification(res.message || 'Data C1 berhasil dihapus.', 'success');
            this.loadC1List();
          },
          error: (err) => this.showNotification(err.error?.message || 'Gagal menghapus data C1.', 'error')
        });
      }
    });
  }

  getTpsInfo(tpsId: string): string {
    const tps = this.tpsList.find(t => t.tps_id === tpsId);
    if (!tps) return tpsId;
    return `TPS ${tps.no_tps} (${tps.kelurahan}, Kec. ${tps.kecamatan})`;
  }

  copyHash(hash: string) {
    navigator.clipboard.writeText(hash);
    this.showNotification('SHA-256 Hash disalin ke clipboard!', 'success');
  }
}
