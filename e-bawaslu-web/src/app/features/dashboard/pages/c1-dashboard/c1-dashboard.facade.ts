import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { C1Service, C1Item } from '../../../../core/services/c1/c1.service';
import { MasterDataService, WilayahTps, Divisi } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface C1State {
  kamar: string;
  selectedKecamatan: string;
  selectedKelurahan: string;
  selectedFilterTps: string;
  selectedFilterYear: string;
  tpsList: WilayahTps[];
  divisiList: Divisi[];
  c1List: C1Item[];
  availableYears: string[];
  isUploading: boolean;
  isOcrScanning: boolean;
  ocrProgress: number;
  ocrStatusText: string;
  selectedFile: File | null;
  editingC1Id: string | null;
}

const initialState: C1State = {
  kamar: 'Pemilu',
  selectedKecamatan: '',
  selectedKelurahan: '',
  selectedFilterTps: '',
  selectedFilterYear: '',
  tpsList: [],
  divisiList: [],
  c1List: [],
  availableYears: [],
  isUploading: false,
  isOcrScanning: false,
  ocrProgress: 0,
  ocrStatusText: '',
  selectedFile: null,
  editingC1Id: null
};

@Injectable({
  providedIn: 'root'
})
export class C1DashboardFacade {
  private c1Service = inject(C1Service);
  private masterDataService = inject(MasterDataService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  private state = new BehaviorSubject<C1State>(initialState);
  state$ = this.state.asObservable();

  c1Form: FormGroup = this.fb.group({
    tps_id: ['', Validators.required],
    jumlah_paslon: [2, Validators.required],
    suara_paslon: this.fb.array([
      this.fb.control(0, [Validators.required, Validators.min(0)]),
      this.fb.control(0, [Validators.required, Validators.min(0)])
    ]),
    total_suara_sah: [0, [Validators.required, Validators.min(0)]],
    total_suara_tidak_sah: [0, [Validators.required, Validators.min(0)]],
    total_pemilih: [0, [Validators.required, Validators.min(0)]]
  });

  get currentState() {
    return this.state.getValue();
  }

  updateState(newState: Partial<C1State>) {
    this.state.next({ ...this.currentState, ...newState });
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Tutup', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? ['bg-red-600', 'text-white'] : (type === 'success' ? ['bg-green-600', 'text-white'] : [])
    });
  }

  loadInitialData() {
    this.masterDataService.getDivisi().subscribe({
      next: res => this.updateState({ divisiList: res.data }),
      error: () => this.showNotification('Gagal memuat divisi.', 'error')
    });
    
    this.masterDataService.getTps().subscribe({
      next: (res) => {
        const tpsList = res.data || [];
        this.updateState({ tpsList });
        if (tpsList.length > 0 && !this.c1Form.value.tps_id) {
          this.c1Form.patchValue({ tps_id: tpsList[0].tps_id });
        }
      },
      error: () => this.updateState({ tpsList: [] })
    });
  }

  loadC1List() {
    const { selectedFilterTps, selectedKecamatan, selectedKelurahan, kamar, selectedFilterYear } = this.currentState;
    
    this.c1Service.getC1List(selectedFilterTps, selectedKecamatan, selectedKelurahan).subscribe({
      next: (res) => {
        let docs = (res.data || []).filter((doc: C1Item) => (doc.jenis_pemilihan || 'Pemilu') === kamar);
        
        const years = new Set<string>();
        docs.forEach((doc: C1Item) => {
          if (doc.created_at) {
            years.add(doc.created_at.split('-')[0]);
          }
        });
        const availableYears = Array.from(years).sort().reverse();
        
        if (selectedFilterYear) {
          docs = docs.filter((doc: C1Item) => doc.created_at?.startsWith(selectedFilterYear));
        }

        this.updateState({ c1List: docs, availableYears });
      },
      error: (err) => {
        console.error('Failed to load C1 list', err);
        this.updateState({ c1List: [] });
      }
    });
  }
  
  changeRegion(kecamatanChanged = false) {
    if (kecamatanChanged) {
      this.updateState({ selectedKelurahan: '' });
    }
    this.updateState({ selectedFilterTps: '' });
    this.loadC1List();
  }

  onFilterTpsChange(tpsId: string) {
    this.updateState({ selectedFilterTps: tpsId });
    this.loadC1List();
  }

  onFilterYearChange(year: string) {
    this.updateState({ selectedFilterYear: year });
    this.loadC1List();
  }
  
  setKamar(kamar: string) {
    this.updateState({ kamar });
    this.resetForm();
    this.loadC1List();
  }

  onJumlahPaslonChange(jumlah: number) {
    if (!jumlah || jumlah < 1) return;
    const arr = this.c1Form.get('suara_paslon') as FormArray;
    const currentLength = arr.length;
    
    if (jumlah > currentLength) {
      for (let i = currentLength; i < jumlah; i++) {
        arr.push(this.fb.control(0, [Validators.required, Validators.min(0)]));
      }
    } else if (jumlah < currentLength) {
      for (let i = currentLength - 1; i >= jumlah; i--) {
        arr.removeAt(i);
      }
    }
  }

  resetForm() {
    this.updateState({ selectedFile: null, editingC1Id: null });
    const currentJumlah = this.c1Form.value.jumlah_paslon;
    this.c1Form.reset({
      tps_id: this.currentState.tpsList.length > 0 ? this.currentState.tpsList[0].tps_id : '',
      jumlah_paslon: currentJumlah,
      total_suara_sah: 0,
      total_suara_tidak_sah: 0,
      total_pemilih: 0
    });
    this.onJumlahPaslonChange(currentJumlah);
  }

  runBackendOcr(file: File) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
       this.showNotification('Format tidak didukung OCR. Gunakan gambar atau PDF.', 'error');
       return;
    }
    
    this.updateState({
      isOcrScanning: true,
      ocrProgress: 0,
      ocrStatusText: 'AI Spatial Scanner sedang menganalisis form...'
    });

    const interval = setInterval(() => {
      let currentProgress = this.currentState.ocrProgress;
      if (currentProgress < 90) {
        currentProgress += 10;
        let text = this.currentState.ocrStatusText;
        if (currentProgress === 30) text = 'Mengekstrak layout kiri-kanan...';
        if (currentProgress === 60) text = 'Menghitung turus & rekognisi angka...';
        this.updateState({ ocrProgress: currentProgress, ocrStatusText: text });
      }
    }, 200);

    const formData = new FormData();
    formData.append('file_c1', file);

    this.c1Service.scanC1Ocr(formData).subscribe({
      next: (res) => {
        clearInterval(interval);
        this.updateState({ ocrProgress: 100, ocrStatusText: 'Selesai!' });
        setTimeout(() => this.updateState({ isOcrScanning: false }), 800);

        const data = res.data;
        const count = this.c1Form.value.jumlah_paslon;
        const arr = this.c1Form.get('suara_paslon') as FormArray;

        for (let i = 1; i <= count; i++) {
          if (data[`paslon_${i}`] !== undefined) {
            arr.at(i - 1)?.setValue(data[`paslon_${i}`]);
          }
        }
        
        this.c1Form.patchValue({
          total_suara_sah: data.suara_sah,
          total_suara_tidak_sah: data.suara_tidak_sah,
          total_pemilih: data.total_pemilih
        });

        this.showNotification(`Tingkat Akurasi AI: ${data.confidence * 100}% - ${res.message}`, 'success');
      },
      error: (err) => {
        clearInterval(interval);
        this.updateState({ isOcrScanning: false });
        this.showNotification('Mesin OCR gagal memproses berkas.', 'error');
      }
    });
  }
  
  submitForm() {
    if (this.c1Form.invalid) {
      this.showNotification('Mohon lengkapi formulir dengan benar.', 'error');
      return;
    }
    
    const { editingC1Id, selectedFile, kamar } = this.currentState;

    if (!editingC1Id && !selectedFile) {
      this.showNotification('Mohon pilih foto form C1 untuk diunggah.', 'error');
      return;
    }

    this.updateState({ isUploading: true });
    
    const paslonValues = this.c1Form.value.suara_paslon;
    const paslonObj: Record<string, number> = {};
    paslonValues.forEach((val: number, idx: number) => {
      paslonObj[idx + 1] = val;
    });

    if (editingC1Id) {
      const updateData = {
        tps_id: this.c1Form.value.tps_id,
        suara_paslon: JSON.stringify(paslonObj),
        total_suara_sah: this.c1Form.value.total_suara_sah,
        total_suara_tidak_sah: this.c1Form.value.total_suara_tidak_sah,
        total_pemilih: this.c1Form.value.total_pemilih
      };

      this.c1Service.updateC1(editingC1Id, updateData).subscribe({
        next: (res) => {
          this.updateState({ isUploading: false });
          this.showNotification('Data C1 berhasil diperbarui.', 'success');
          this.resetForm();
          this.loadC1List();
        },
        error: (err) => {
          this.updateState({ isUploading: false });
          this.showNotification(err.error?.message || 'Gagal memperbarui C1.', 'error');
        }
      });
    } else {
      const formData = new FormData();
      formData.append('jenis_pemilihan', kamar);
      if (kamar === 'Pilkada') formData.append('sub_jenis_pemilihan', 'Wali Kota');
      formData.append('tps_id', this.c1Form.value.tps_id);
      formData.append('suara_paslon', JSON.stringify(paslonObj));
      formData.append('total_suara_sah', this.c1Form.value.total_suara_sah);
      formData.append('total_suara_tidak_sah', this.c1Form.value.total_suara_tidak_sah);
      formData.append('total_pemilih', this.c1Form.value.total_pemilih);
      formData.append('file_c1', selectedFile!);

      this.c1Service.uploadC1(formData).subscribe({
        next: (res) => {
          this.updateState({ isUploading: false });
          this.showNotification('Foto/dokumen C1 berhasil diunggah dan disimpan.', 'success');
          this.resetForm();
          this.loadC1List();
        },
        error: (err) => {
          this.updateState({ isUploading: false });
          if (err.status === 409) {
            this.showNotification('DUPLIKASI TERDETEKSI: Berkas C1 ini memiliki hash SHA-256 yang identik dengan server!', 'error');
          } else {
            this.showNotification(err.error?.message || 'Gagal mengunggah Form C1.', 'error');
          }
        }
      });
    }
  }

  deleteC1(id: string) {
    this.c1Service.deleteC1(id).subscribe({
      next: (res) => {
        this.showNotification(res.message || 'Data C1 berhasil dihapus.', 'success');
        this.loadC1List();
      },
      error: (err) => this.showNotification(err.error?.message || 'Gagal menghapus data C1.', 'error')
    });
  }

  approveC1(id: string, status: 'Approved' | 'Rejected' | 'Revision') {
    this.c1Service.approveC1(id, status).subscribe({
      next: (res) => {
        this.showNotification(res.message || `Status C1 berhasil diubah menjadi ${status}`, 'success');
        this.loadC1List();
      },
      error: (err) => this.showNotification(err.error?.message || 'Gagal mengubah status.', 'error')
    });
  }

  assignApproval(id: string, division: string) {
    return this.c1Service.assignApproval(id, division);
  }

  downloadC1(item: C1Item) {
    this.c1Service.download(item.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        const ext = blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg';
        a.download = `C1-${item.id}.${ext}`; a.click(); URL.revokeObjectURL(url);
      },
      error: err => this.showNotification('Gagal mengunduh dokumen C1.', 'error')
    });
  }

  editC1(c1: C1Item) {
    this.updateState({ editingC1Id: c1.id });
    
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
    
    this.showNotification('Mode Edit diaktifkan. Silakan perbaiki angka di atas lalu klik "Perbarui Data C1".', 'info');
  }
}
