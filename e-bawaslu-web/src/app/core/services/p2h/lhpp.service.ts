import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { LhppResponse, SingleLhppResponse, LhppItem } from '../../models/lhpp.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LhppService {
  private api = inject(ApiService);

  getLhppList(filters?: { tps_id?: string; status?: string; tahapan?: string; search?: string }): Observable<LhppResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.tps_id) params = params.set('tps_id', filters.tps_id);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.tahapan) params = params.set('tahapan', filters.tahapan);
      if (filters.search) params = params.set('search', filters.search);
    }
    return this.api.get<LhppResponse>('/p2h/lhpp', params);
  }

  getLhppById(id: string): Observable<SingleLhppResponse> {
    return this.api.get<SingleLhppResponse>(`/p2h/lhpp/${id}`);
  }

  uploadLhpp(formData: FormData): Observable<SingleLhppResponse> {
    return this.api.post<SingleLhppResponse>('/p2h/lhpp', formData);
  }

  updateLhpp(id: string, formData: FormData): Observable<SingleLhppResponse> {
    return this.api.post<SingleLhppResponse>(`/p2h/lhpp/${id}`, formData);
  }

  verifyLhpp(id: string, status: string, catatanVerifikasi?: string): Observable<SingleLhppResponse> {
    return this.api.post<SingleLhppResponse>(`/p2h/lhpp/${id}/verify`, {
      status,
      catatan_verifikasi: catatanVerifikasi
    });
  }

  deleteLhpp(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`/p2h/lhpp/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `${environment.apiUrl}/p2h/lhpp/${id}/download`;
  }
}
