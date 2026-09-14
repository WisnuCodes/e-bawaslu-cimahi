import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';

export interface Divisi {
  divisi_id: string;
  nama_divisi: string;
  kode_divisi: string;
}

export interface Tahapan {
  id: string;
  divisi_id: string;
  nama_tahapan: string;
}

export interface WilayahTps {
  tps_id: string;
  nama_tps?: string;
  no_tps: number;
  kelurahan: string;
  kecamatan: string;
  kota: string;
}

@Injectable({
  providedIn: 'root'
})
export class MasterDataService {
  private api = inject(ApiService);

  // In-memory cache streams
  private divisiCache$?: Observable<{ success: boolean; data: Divisi[] }>;
  private tpsCache$?: Observable<{ success: boolean; data: WilayahTps[] }>;
  private tahapanCache$?: Observable<{ data: Tahapan[] }>;

  /**
   * Mengambil daftar divisi internal Bawaslu dengan in-memory caching.
   * @param forceRefresh Jika true, memaksa request baru ke server mengabaikan cache
   */
  getDivisi(forceRefresh: boolean = false): Observable<{ success: boolean; data: Divisi[] }> {
    if (!this.divisiCache$ || forceRefresh) {
      this.divisiCache$ = this.api.get<{ success: boolean; data: Divisi[] }>('/master/divisi').pipe(
        catchError(err => {
          this.divisiCache$ = undefined; // Bersihkan cache jika terjadi error agar request berikutnya mencoba kembali
          return throwError(() => err);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.divisiCache$;
  }

  /**
   * Mengambil daftar tahapan pengawasan pemilu dengan in-memory caching.
   * @param forceRefresh Jika true, memaksa request baru ke server mengabaikan cache
   */
  getTahapan(forceRefresh: boolean = false): Observable<{ data: Tahapan[] }> {
    if (!this.tahapanCache$ || forceRefresh) {
      this.tahapanCache$ = this.api.get<{ data: Tahapan[] }>('/tahapan').pipe(
        catchError(err => {
          this.tahapanCache$ = undefined;
          return throwError(() => err);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.tahapanCache$;
  }

  /**
   * Menambahkan tahapan baru dan otomatis membatalkan (purge) cache tahapan.
   */
  createTahapan(data: { nama_tahapan: string; divisi_id: string }): Observable<{ data: Tahapan }> {
    return this.api.post<{ data: Tahapan }>('/tahapan', data).pipe(
      tap(() => {
        this.tahapanCache$ = undefined; // Invalidate cache otomatis
      })
    );
  }

  /**
   * Menghapus tahapan dan otomatis membatalkan (purge) cache tahapan.
   */
  deleteTahapan(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/tahapan/${id}`).pipe(
      tap(() => {
        this.tahapanCache$ = undefined; // Invalidate cache otomatis
      })
    );
  }

  /**
   * Mengambil daftar seluruh TPS di Kota Cimahi dengan in-memory caching.
   * @param forceRefresh Jika true, memaksa request baru ke server mengabaikan cache
   */
  getTps(forceRefresh: boolean = false): Observable<{ success: boolean; data: WilayahTps[] }> {
    if (!this.tpsCache$ || forceRefresh) {
      this.tpsCache$ = this.api.get<{ success: boolean; data: WilayahTps[] }>('/master/tps').pipe(
        catchError(err => {
          this.tpsCache$ = undefined;
          return throwError(() => err);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.tpsCache$;
  }

  /**
   * Menghapus seluruh in-memory cache data master.
   * Berguna dipanggil saat logout atau saat pengguna menekan tombol sinkronisasi ulang.
   */
  clearAllCache(): void {
    this.divisiCache$ = undefined;
    this.tpsCache$ = undefined;
    this.tahapanCache$ = undefined;
  }
}
