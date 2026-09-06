import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';

export interface UserManagementUser {
  user_id?: string;
  username?: string;
  name?: string;
  email?: string;
  whatsapp_number?: string;
  role?: string;
  divisi_id?: string | null;
  tps_id?: string | null;
  status_aktif?: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private api = inject(ApiService);

  getUsers(): Observable<{ success: boolean; data: UserManagementUser[] }> {
    return this.api.get<{ success: boolean; data: UserManagementUser[] }>('/admin/users');
  }

  getUserById(id: string): Observable<{ success: boolean; data: UserManagementUser }> {
    return this.api.get<{ success: boolean; data: UserManagementUser }>(`/admin/users/${id}`);
  }

  createUser(payload: any): Observable<any> {
    return this.api.post<any>('/admin/users', payload);
  }

  updateUser(id: string, payload: any): Observable<any> {
    return this.api.put<any>(`/admin/users/${id}`, payload);
  }

  deleteUser(id: string): Observable<any> {
    return this.api.delete<any>(`/admin/users/${id}`);
  }
}
