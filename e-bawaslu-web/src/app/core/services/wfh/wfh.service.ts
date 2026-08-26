import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WfhService {
  private api = inject(ApiService);

  checkIn(data: any): Observable<any> {
    return this.api.post<any>('/wfh/checkin', data);
  }

  checkOut(data: any): Observable<any> {
    return this.api.post<any>('/wfh/checkout', data);
  }

  getPresensi(): Observable<any> {
    return this.api.get<any>('/wfh/presensi');
  }

  updatePresensi(id: string, data: any): Observable<any> {
    return this.api.put<any>(`/wfh/presensi/${id}`, data);
  }

  deletePresensi(id: string): Observable<any> {
    return this.api.delete<any>(`/wfh/presensi/${id}`);
  }

  getWorklogs(): Observable<any> {
    return this.api.get<any>('/wfh/worklogs');
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

  // Tukin (Tunjangan Kinerja)
  getTukin(): Observable<any> {
    return this.api.get<any>('/wfh/tukin');
  }

  calculateTukin(bulan: number, tahun: number): Observable<any> {
    return this.api.post<any>('/wfh/tukin/calculate', { bulan, tahun });
  }
}
