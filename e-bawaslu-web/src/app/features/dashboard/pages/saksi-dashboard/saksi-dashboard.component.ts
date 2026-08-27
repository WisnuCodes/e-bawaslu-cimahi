import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SaksiService, Saksi } from '../../../../core/services/saksi.service';
import { MasterDataService, WilayahTps } from '../../../../core/services/master-data.service';
import { ConfirmDialogComponent } from '../../../../shared/components/molecules/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-saksi-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatPaginatorModule, MatDialogModule
  ],
  templateUrl: './saksi-dashboard.component.html',
  styleUrl: './saksi-dashboard.component.css'
})
export class SaksiDashboardComponent implements OnInit {
  private saksiService = inject(SaksiService);
  private masterDataService = inject(MasterDataService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  saksiList: Saksi[] = [];
  tpsList: WilayahTps[] = [];
  displayedColumns: string[] = ['username', 'email', 'whatsapp_number', 'tps', 'aksi'];
  saksiForm!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.saksiForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      whatsapp_number: [''],
      tps_id: ['', Validators.required]
    });

    this.loadTps();
    this.loadSaksi();
  }

  loadTps(): void {
    this.masterDataService.getTps().subscribe({
      next: (res) => {
        if (res.success) this.tpsList = res.data;
      }
    });
  }

  loadSaksi(): void {
    this.saksiService.getSaksi().subscribe({
      next: (res) => {
        if (res.success) this.saksiList = res.data;
      }
    });
  }

  onSubmit(): void {
    if (this.saksiForm.invalid) return;
    this.isSubmitting = true;
    
    this.saksiService.createSaksi(this.saksiForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Akun Saksi berhasil dibuat!', 'Tutup', { duration: 3000 });
          this.saksiForm.reset();
          Object.keys(this.saksiForm.controls).forEach(key => {
            this.saksiForm.get(key)?.setErrors(null);
          });
          this.loadSaksi();
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Gagal membuat akun Saksi', 'Tutup', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  onDelete(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Hapus Akun Saksi',
        message: 'Apakah Anda yakin ingin menghapus akun Saksi ini?',
        confirmText: 'Ya, Hapus'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saksiService.deleteSaksi(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Akun Saksi berhasil dihapus', 'Tutup', { duration: 3000 });
              this.loadSaksi();
            }
          },
          error: (err) => {
            this.snackBar.open('Gagal menghapus akun', 'Tutup', { duration: 3000 });
          }
        });
      }
    });
  }

  getTpsInfo(tpsId: string): string {
    const tps = this.tpsList.find(t => t.tps_id === tpsId);
    if (tps) {
      return "TPS " + tps.no_tps + " - " + tps.kelurahan;
    }
    return '-';
  }
}
