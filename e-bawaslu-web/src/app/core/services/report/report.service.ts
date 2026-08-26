import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private api = inject(ApiService);

  exportPdf(tipe_laporan: 'presensi' | 'worklog', bulan: number, tahun: number): Observable<Blob> {
    const params = new HttpParams()
      .set('tipe_laporan', tipe_laporan)
      .set('bulan', bulan.toString())
      .set('tahun', tahun.toString());

    return this.api.getBlob('/reports/export', params);
  }
}
