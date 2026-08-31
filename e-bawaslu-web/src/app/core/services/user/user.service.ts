import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';

export interface User {
  user_id: string;
  username: string;
  email: string;
  whatsapp_number?: string;
  role: string;
  divisi_id?: string;
  nama_divisi?: string;
  tps_id?: string;
  status_aktif: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = inject(ApiService);

  getUsers(): Observable<{ success: boolean; data: User[] }> {
    return this.api.get<{ success: boolean; data: User[] }>('/users');
  }

  getUser(id: string): Observable<{ success: boolean; data: User }> {
    return this.api.get<{ success: boolean; data: User }>(`/users/${id}`);
  }

  createUser(data: Partial<User> & { password?: string }): Observable<any> {
    return this.api.post('/users', data);
  }

  updateUser(id: string, data: Partial<User> & { password?: string }): Observable<any> {
    return this.api.put(`/users/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.api.delete(`/users/${id}`);
  }
}
