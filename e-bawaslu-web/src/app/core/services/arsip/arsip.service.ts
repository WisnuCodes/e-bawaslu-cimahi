import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArsipService {
  private api = inject(ApiService);

  getArsip(): Observable<any> {
    return this.api.get<any>('/arsip');
  }

  uploadArsip(formData: FormData): Observable<any> {
    return this.api.post<any>('/arsip', formData);
  }

  searchArsip(query: string): Observable<any> {
    return this.api.get<any>(`/arsip/search?q=${query}`);
  }
}
