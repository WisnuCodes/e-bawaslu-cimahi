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
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private api = inject(ApiService);

  getAuditLogs(page: number = 1): Observable<{ data: AuditLogItem[]; links?: any; meta?: any }> {
    const params = new HttpParams().set('page', page.toString());
    return this.api.get<{ data: AuditLogItem[]; links?: any; meta?: any }>('/audit-logs', params);
  }
}
