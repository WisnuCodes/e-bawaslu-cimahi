import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface C1Item {
  id: string;
  tps_id: string;
  uploaded_by: string;
  total_suara_sah: number;
  total_suara_tidak_sah: number;
  total_pemilih: number;
  suara_paslon?: Record<string, number>;
  sha256_hash: string;
  file_url: string;
  status_c1: 'Draft' | 'Approved' | 'Rejected' | 'Revision' | 'Mismatch';
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class C1Service {
  private api = inject(ApiService);

  getC1List(tpsId?: string): Observable<{ data: C1Item[] }> {
    let params = new HttpParams();
    if (tpsId) {
      params = params.set('tps_id', tpsId);
    }
    return this.api.get<{ data: C1Item[] }>('/c1', params);
  }

  uploadC1(formData: FormData): Observable<any> {
    return this.api.post<any>('/c1', formData);
  }

  approveC1(id: string, status: 'Approved' | 'Rejected' | 'Revision'): Observable<any> {
    return this.api.post<any>(`/c1/${id}/approve`, { status });
  }

  updateC1(id: string, data: any): Observable<any> {
    return this.api.put<any>(`/c1/${id}`, data);
  }

  deleteC1(id: string): Observable<any> {
    return this.api.delete<any>(`/c1/${id}`);
  }

  scanC1Ocr(formData: FormData): Observable<any> {
    return this.api.post<any>('/c1/scan', formData);
  }
}
