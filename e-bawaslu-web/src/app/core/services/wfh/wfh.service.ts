import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WfhService {
  private api = inject(ApiService);

  checkIn(data: any): Observable<any> {
    return this.api.post<any>('/wfh/presensi/check-in', data);
  }

  getStatusHariIni(): Observable<any> {
    return this.api.get<any>('/wfh/presensi/status-hari-ini');
  }

  submitIzin(data: FormData): Observable<any> {
    return this.api.post<any>('/wfh/izin', data);
  }

  checkOut(data: any): Observable<any> {
    return this.api.post<any>('/wfh/checkout', data);
  }

  getPresensi(startDate?: string, endDate?: string): Observable<any> {
    let params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    return this.api.get<any>(`/wfh/presensi${queryString ? '?' + queryString : ''}`);
  }

  updatePresensi(id: string, data: any): Observable<any> {
    return this.api.put<any>(`/wfh/presensi/${id}`, data);
  }

  deletePresensi(id: string): Observable<any> {
    return this.api.delete<any>(`/wfh/presensi/${id}`);
  }

  getWorklogs(startDate?: string, endDate?: string): Observable<any> {
    let params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    return this.api.get<any>(`/wfh/worklogs${queryString ? '?' + queryString : ''}`);
  }

  submitWorklog(data: FormData | any): Observable<any> {
    return this.api.post<any>('/wfh/worklogs', data);
  }

  updateWorklog(id: string, data: FormData | any): Observable<any> {
    return this.api.post<any>(`/wfh/worklogs/${id}`, data);
  }

  deleteWorklog(id: string): Observable<any> {
    return this.api.delete<any>(`/wfh/worklogs/${id}`);
  }

  approveWorklog(id: string, status: 'Approved' | 'Revised', notes?: string): Observable<any> {
    return this.api.post<any>(`/wfh/worklogs/${id}/approve`, { status, catatan_revisi: notes });
  }


}
