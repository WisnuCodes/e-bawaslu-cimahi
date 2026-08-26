import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../../../shared/components/molecules/card/card.component';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ArsipService } from '../../../../core/services/arsip/arsip.service';
import { C1Service, C1Item } from '../../../../core/services/c1/c1.service';
import { WfhService } from '../../../../core/services/wfh/wfh.service';
import { AuthService } from '../../../../core/services/auth.service';

interface PresensiItem {
  presensi_id?: string;
  user_id?: string;
  nama_pegawai?: string;
  timestamp_checkin?: string;
  timestamp_checkout?: string;
  status_kehadiran?: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    CardComponent, 
    DateFormatPipe, 
    MatIconModule, 
    MatButtonModule,
    MatProgressBarModule
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent implements OnInit {
  private arsipService = inject(ArsipService);
  private c1Service = inject(C1Service);
  private wfhService = inject(WfhService);
  public authService = inject(AuthService);

  today: Date = new Date();
  
  totalArsip: number = 0;
  totalC1: number = 0;
  c1MismatchCount: number = 0;
  totalTpsTarget: number = 15;
  c1ProgressPercentage: number = 0;
  pendingApprovalWorklog: number = 0;
  presensiTodayStatus: 'Checked In' | 'Checked Out' | 'Belum Presensi' = 'Belum Presensi';

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    // 1. Arsip count
    this.arsipService.getArsip().subscribe({
      next: (res: any) => {
        this.totalArsip = (res?.data || []).length;
      },
      error: () => {
        this.totalArsip = 0;
      }
    });

    // 2. C1 count, mismatches & live progress
    this.c1Service.getC1List().subscribe({
      next: (res: { data: C1Item[] }) => {
        const list: C1Item[] = res?.data || [];
        this.totalC1 = list.length;
        this.c1MismatchCount = list.filter((c: C1Item) => c.status_c1 === 'Mismatch').length;
        this.c1ProgressPercentage = Math.min(100, Math.round((this.totalC1 / this.totalTpsTarget) * 100));
      },
      error: () => {
        this.totalC1 = 0;
      }
    });

    // 3. Presensi & Worklog pending status
    this.wfhService.getPresensi().subscribe({
      next: (res: any) => {
        const list: PresensiItem[] = res?.data || [];
        const todayStr = new Date().toISOString().split('T')[0];
        const currentUsername = this.authService.currentUser()?.username;

        const myToday = list.find((p: PresensiItem) => 
          Boolean(p.timestamp_checkin && p.timestamp_checkin.startsWith(todayStr) && p.nama_pegawai === currentUsername)
        );

        if (myToday) {
          this.presensiTodayStatus = myToday.timestamp_checkout ? 'Checked Out' : 'Checked In';
        } else {
          this.presensiTodayStatus = 'Belum Presensi';
        }
      },
      error: () => {
        this.presensiTodayStatus = 'Belum Presensi';
      }
    });

    this.wfhService.getWorklogs().subscribe({
      next: (res: any) => {
        const list = res?.data || [];
        this.pendingApprovalWorklog = list.filter((w: any) => w.status_approval === 'Pending').length;
      },
      error: () => {
        this.pendingApprovalWorklog = 0;
      }
    });
  }
}
