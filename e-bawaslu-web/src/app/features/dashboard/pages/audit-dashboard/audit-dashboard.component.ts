import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService, AuditLogItem } from '../../../../core/services/audit/audit.service';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-audit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule
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

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs(page: number = 1) {
    this.isLoading = true;
    this.currentPage = page;
    this.auditService.getAuditLogs(page).subscribe({
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
}
