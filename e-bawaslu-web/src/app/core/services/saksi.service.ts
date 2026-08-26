import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Saksi {
  user_id: string;
  username: string;
  email: string;
  whatsapp_number?: string;
  tps_id: string;
  no_tps?: number;
  kelurahan?: string;
  kecamatan?: string;
}

export interface SaksiResponse {
  success: boolean;
  data: Saksi[];
}

@Injectable({
  providedIn: 'root'
})
export class SaksiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/saksi';

  getSaksi(): Observable<SaksiResponse> {
    return this.http.get<SaksiResponse>(this.apiUrl);
  }

  createSaksi(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  deleteSaksi(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}