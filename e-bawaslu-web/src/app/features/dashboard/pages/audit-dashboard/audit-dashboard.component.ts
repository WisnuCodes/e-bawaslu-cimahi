import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditLogItem } from '../../../../core/services/audit/audit.service';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-audit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './audit-dashboard.component.html',
  styleUrl: './audit-dashboard.component.css'
})
export class AuditDashboardComponent implements OnInit {
  private auditService = inject(AuditService);

  logs: AuditLogItem[] = [];
  displayedColumns: string[] = ['timestamp', 'actor', 'action', 'target', 'ip', 'reason'];
  isLoading = false;
  currentPage = 1;
  
  searchKeyword: string = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  ngOnInit() {
    this.loadLogs();
  }

  formatDateForApi(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  loadLogs(page: number = 1) {
    this.isLoading = true;
    this.currentPage = page;
    
    const startStr = this.formatDateForApi(this.startDate);
    const endStr = this.formatDateForApi(this.endDate);
    
    this.auditService.getAuditLogs(page, this.searchKeyword, startStr, endStr).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.logs = res.data || [];
      },
      error: () => {
        this.isLoading = false;
        this.logs = [];
      }
    });
  }
  
  applyFilter() {
    this.loadLogs(1);
  }

  resetFilter() {
    this.searchKeyword = '';
    this.startDate = null;
    this.endDate = null;
    this.loadLogs(1);
  }

  getActionBadgeColor(action: string): { bg: string; text: string } {
    const act = (action || '').toUpperCase();
    if (act.includes('POST') || act.includes('CREATE') || act.includes('STORE')) {
      return { bg: '#dcfce7', text: '#166534' };
    }
    if (act.includes('PUT') || act.includes('UPDATE') || act.includes('REVISI') || act.includes('APPROVE')) {
      return { bg: '#e0f2fe', text: '#0369a1' };
    }
    if (act.includes('DELETE') || act.includes('DESTROY')) {
      return { bg: '#fee2e2', text: '#991b1b' };
    }
    return { bg: '#f1f5f9', text: '#475569' };
  }

  formatTargetData(target: string): string {
    if (!target) return '-';
    
    // Convert API paths to human readable text
    if (target.includes('api/wfh/checkin')) return 'Data Presensi Harian';
    if (target.includes('api/wfh/worklogs')) {
      if (target.includes('/approve')) return 'Persetujuan Worklog';
      return 'Data Laporan Kerja (Worklog)';
    }
    if (target.includes('api/auth/login')) return 'Sesi Login Sistem';
    if (target.includes('api/auth/logout')) return 'Sesi Logout Sistem';
    if (target.includes('api/users')) return 'Data Pengguna';
    
    return target;
  }
  
  formatReason(reason: string | null): string {
    if (!reason) return '-';
    
    try {
      if (reason.startsWith('Payload: ')) {
        const payloadStr = reason.substring(9);
        const payload = JSON.parse(payloadStr);
        
        let explanation = [];
        
        // Custom formatting based on payload properties
        if (payload.gps_koordinat) {
          explanation.push(`Lokasi terdeteksi`);
        }
        if (payload.status) {
          explanation.push(`Mengubah status menjadi "${payload.status}"`);
        }
        if (payload.rincian_aktivitas || payload.activity) {
          explanation.push(`Mengisi aktivitas kerja`);
        }
        
        if (explanation.length > 0) {
          return explanation.join(', ');
        }
        
        // Fallback for simple payload formatting
        const keys = Object.keys(payload);
        if (keys.length > 0) {
           return `Memperbarui data: ${keys.join(', ')}`;
        }
      }
    } catch (e) {
      // Return original if parsing fails
    }
    
    return reason;
  }
}
