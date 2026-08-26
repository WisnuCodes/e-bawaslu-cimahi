import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class C1Service {
  private api = inject(ApiService);

  getC1List(): Observable<any> {
    return this.api.get<any>('/c1');
  }

  uploadC1(formData: FormData): Observable<any> {
    return this.api.post<any>('/c1', formData);
  }
}
