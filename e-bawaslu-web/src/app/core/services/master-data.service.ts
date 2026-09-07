import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

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

  getDivisi(): Observable<{ success: boolean; data: Divisi[] }> {
    return this.api.get<{ success: boolean; data: Divisi[] }>('/master/divisi');
  }

  getTahapan(): Observable<{ data: Tahapan[] }> {
    return this.api.get<{ data: Tahapan[] }>('/tahapan');
  }

  createTahapan(data: { nama_tahapan: string; divisi_id: string }) {
    return this.api.post<{ data: Tahapan }>('/tahapan', data);
  }

  deleteTahapan(id: string) {
    return this.api.delete<{ message: string }>(`/tahapan/${id}`);
  }

  getTps(): Observable<{ success: boolean; data: WilayahTps[] }> {
    return this.api.get<{ success: boolean; data: WilayahTps[] }>('/master/tps');
  }
}
