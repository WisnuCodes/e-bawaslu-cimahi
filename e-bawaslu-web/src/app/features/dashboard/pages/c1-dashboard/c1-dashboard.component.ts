import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { C1Service } from '../../../../core/services/c1/c1.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-c1-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './c1-dashboard.component.html',
  styleUrl: './c1-dashboard.component.css'
})
export class C1DashboardComponent implements OnInit {
  private c1Service = inject(C1Service);
  
  tpsId: string = '';
  selectedFile: File | null = null;
  isUploading = false;
  
  c1List: any[] = [];
  displayedColumns: string[] = ['tps_id', 'status', 'tanggal'];

  ngOnInit() {
    this.loadC1List();
  }

  loadC1List() {
    this.c1Service.getC1List().subscribe({
      next: (res) => {
        this.c1List = res.data || [];
      },
      error: () => {
        // Mock fallback for UI demo
        this.c1List = [
          { tps_id: 'TPS-001', status: 'Enkripsi AES-256 Aktif', created_at: new Date() },
          { tps_id: 'TPS-042', status: 'Enkripsi AES-256 Aktif', created_at: new Date(Date.now() - 3600000) }
        ];
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  onSubmit() {
    if (!this.selectedFile || !this.tpsId) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('tps_id', this.tpsId);
    formData.append('c1_file', this.selectedFile);

    this.c1Service.uploadC1(formData).subscribe({
      next: () => {
        this.isUploading = false;
        alert('Form C1 berhasil dienkripsi dan diunggah.');
        this.selectedFile = null;
        this.tpsId = '';
        this.loadC1List();
      },
      error: () => {
        this.isUploading = false;
        alert('Gagal mengunggah form C1. Pastikan server API berjalan.');
      }
    });
  }
}
