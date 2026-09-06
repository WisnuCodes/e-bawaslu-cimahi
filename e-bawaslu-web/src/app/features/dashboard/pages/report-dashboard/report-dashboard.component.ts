import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { ReportService } from '../../../../core/services/report/report.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDatepickerModule
  ],
  templateUrl: './report-dashboard.component.html',
  styleUrl: './report-dashboard.component.css'
})
export class ReportDashboardComponent {
  private reportService = inject(ReportService);
  private snackBar = inject(MatSnackBar);

  tipeLaporan: 'presensi' | 'worklog' = 'presensi';
  isExporting = false;

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(new Date()),
    end: new FormControl<Date | null>(new Date()),
  });

  exportReport() {
    const start = this.dateRange.value.start;
    const end = this.dateRange.value.end;

    if (!start || !end) {
      this.snackBar.open('Silakan pilih rentang tanggal laporan.', 'Tutup', { duration: 3000 });
      return;
    }

    // Format dates to YYYY-MM-DD
    const start_date = start.toISOString().split('T')[0];
    const end_date = end.toISOString().split('T')[0];

    this.isExporting = true;
    this.reportService.exportPdf(this.tipeLaporan, start_date, end_date).subscribe({
      next: (blob: Blob) => {
        this.isExporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan_${this.tipeLaporan}_${start_date}_${end_date}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Laporan PDF berhasil diunduh!', 'Tutup', { duration: 3000 });
      },
      error: () => {
        this.isExporting = false;
        this.snackBar.open('Gagal mengekspor laporan PDF.', 'Tutup', { duration: 3000 });
      }
    });
  }
}
