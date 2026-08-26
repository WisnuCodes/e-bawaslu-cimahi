import { Component, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArsipService } from '../../../../core/services/arsip/arsip.service';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-arsip-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './arsip-dashboard.component.html',
  styleUrl: './arsip-dashboard.component.css'
})
export class ArsipDashboardComponent implements OnInit {
  private arsipService = inject(ArsipService);
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  documents: any[] = [];
  displayedColumns: string[] = ['ikon', 'judul', 'klasifikasi', 'tanggal', 'aksi'];
  isUploading = false;
  
  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.arsipService.getArsip().subscribe({
      next: (res) => {
        // Mock data fallback if API is not fully running
        this.documents = res?.data || [
          { id: 1, title: 'Laporan Keuangan Q1.pdf', klasifikasi: 'Keuangan', created_at: new Date() },
          { id: 2, title: 'SK Pengangkatan 2026.docx', klasifikasi: 'SDM', created_at: new Date() }
        ];
      },
      error: () => {
        // Fallback for visual demonstration
        this.documents = [
          { id: 1, title: 'Laporan Keuangan Q1.pdf', klasifikasi: 'Keuangan', created_at: new Date() },
          { id: 2, title: 'SK Pengangkatan 2026.docx', klasifikasi: 'SDM', created_at: new Date() },
          { id: 3, title: 'Bukti Pelanggaran 001.jpg', klasifikasi: 'Hukum', created_at: new Date() }
        ];
      }
    });
  }

  triggerUpload() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', file);
      
      this.arsipService.uploadArsip(formData).subscribe({
        next: () => {
          this.isUploading = false;
          alert('File berhasil diunggah!');
          this.loadDocuments();
        },
        error: () => {
          this.isUploading = false;
          alert('Gagal mengunggah file. Pastikan server API berjalan.');
        }
      });
    }
  }

  onSearch(event: any) {
    const query = event.target.value;
    if (query.length > 2) {
      this.arsipService.searchArsip(query).subscribe({
        next: (res) => this.documents = res.data,
        error: () => console.log('Search error fallback')
      });
    } else if (query.length === 0) {
      this.loadDocuments();
    }
  }
}
