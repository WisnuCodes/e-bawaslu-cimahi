import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface ArsipItem {
  id: string;
  divisi_id: string;
  created_by: string;
  no_surat: string;
  tgl_surat: string;
  perihal: string;
  kategori: string;
  klasifikasi: string;
  file_path: string;
  version: string;
  is_locked: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VersionHistoryItem {
  history_id: string;
  arsip_id: string;
  version_name: string;
  file_path: string;
  uploaded_by: string;
  catatan_revisi: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArsipService {
  private api = inject(ApiService);

  getArsip(divisiId?: string): Observable<{ success: boolean; data: ArsipItem[] }> {
    let params = new HttpParams();
    if (divisiId) {
      params = params.set('divisi_id', divisiId);
    }
    return this.api.get<{ success: boolean; data: ArsipItem[] }>('/arsip', params);
  }

  uploadArsip(formData: FormData): Observable<any> {
    return this.api.post<any>('/arsip', formData);
  }

  uploadRevisi(id: string, formData: FormData): Observable<any> {
    return this.api.post<any>(`/arsip/${id}/revisi`, formData);
  }

  getVersions(id: string): Observable<{ success: boolean; data: { current_version: ArsipItem; history: VersionHistoryItem[] } }> {
    return this.api.get<{ success: boolean; data: { current_version: ArsipItem; history: VersionHistoryItem[] } }>(`/arsip/${id}/versions`);
  }

  downloadWatermarked(id: string): Observable<Blob> {
    return this.api.getBlob(`/arsip/${id}/download`);
  }

  searchArsip(query: string): Observable<{ success: boolean; message?: string; data: ArsipItem[] }> {
    const params = new HttpParams().set('q', query);
    return this.api.get<{ success: boolean; message?: string; data: ArsipItem[] }>('/arsip/search', params);
  }

  deleteArsip(id: string, reason: string): Observable<any> {
    return this.api.delete<any>(`/arsip/${id}`, { alasan_penghapusan: reason });
  }
}
