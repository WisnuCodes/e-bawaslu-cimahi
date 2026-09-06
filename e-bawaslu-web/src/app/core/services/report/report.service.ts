import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private api = inject(ApiService);

  exportPdf(tipe_laporan: 'presensi' | 'worklog', start_date: string, end_date: string): Observable<Blob> {
    const params = new HttpParams()
      .set('tipe_laporan', tipe_laporan)
      .set('start_date', start_date)
      .set('end_date', end_date);

    return this.api.getBlob('/reports/export', params);
  }
}
