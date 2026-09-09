import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface AuditLogItem {
  id: string;
  actor_id: string;
  action: string;
  target_entity: string;
  ip_address: string;
  reason: string | null;
  timestamp: string;
  user?: {
    username: string;
    email: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private api = inject(ApiService);

  getAuditLogs(page: number = 1, search: string = '', startDate: string = '', endDate: string = ''): Observable<{ data: AuditLogItem[]; links?: any; meta?: any }> {
    let params = new HttpParams().set('page', page.toString());
    if (search) params = params.set('search', search);
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    
    return this.api.get<{ data: AuditLogItem[]; links?: any; meta?: any }>('/audit-logs', params);
  }
}
