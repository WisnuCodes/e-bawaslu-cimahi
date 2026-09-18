import { Component, inject, ViewChild, ElementRef, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArsipFacade } from '../../arsip.facade';
import { FilePreviewComponent } from '../../../../../../shared/components/molecules/file-preview/file-preview.component';

@Component({
  selector: 'app-arsip-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FilePreviewComponent
  ],
  templateUrl: './arsip-upload.component.html'
})
export class ArsipUploadComponent implements OnInit {
  public facade = inject(ArsipFacade);
  private fb = inject(FormBuilder);

  @ViewChild('uploadFileInput') uploadFileInput!: ElementRef<HTMLInputElement>;

  uploadForm: FormGroup;
  uploadFile: File | null = null;

  kategoriList = ['Surat Keputusan', 'Surat Masuk', 'Surat Keluar', 'Berita Acara', 'Nota Dinas', 'Laporan Pengawasan', 'MHP'];
  klasifikasiList = ['Biasa', 'Penting', 'Rahasia', 'Sangat Rahasia'];
  jenjangList = ['Panwascam', 'PKD', 'PTPS'];

  constructor() {
    this.uploadForm = this.fb.group({
      divisi_id: ['', Validators.required],
      no_surat: ['', Validators.required],
      tgl_surat: [new Date().toISOString().split('T')[0], Validators.required],
      perihal: ['', Validators.required],
      kategori: ['Surat Keputusan', Validators.required],
      jenjang_pengawas: [''],
      klasifikasi: ['Biasa', Validators.required]
    });

    effect(() => {
      if (this.facade.showUploadModal()) {
        const auth = this.facade.authService;
        const divisiList = this.facade.divisiList();
        this.uploadForm.reset({
          divisi_id: divisiList.length > 0 ? divisiList[0].divisi_id : '',
          no_surat: '',
          tgl_surat: new Date().toISOString().split('T')[0],
          perihal: '',
          kategori: 'Surat Keputusan',
          jenjang_pengawas: auth.isSaksiTps ? 'PTPS' : (auth.userRole.toLowerCase().includes('panwascam') ? 'Panwascam' : (auth.userRole.toLowerCase().includes('pkd') ? 'PKD' : '')),
          klasifikasi: 'Biasa'
        });
        this.uploadFile = null;
      }
    });
  }

  ngOnInit(): void {}

  onUploadFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.uploadFile = event.target.files[0];
    }
  }

  submitUpload() {
    if (this.uploadForm.invalid || !this.uploadFile || (this.uploadForm.value.kategori === 'MHP' && !this.uploadForm.value.jenjang_pengawas)) {
      this.facade.showNotification('Mohon lengkapi semua field dan sertakan file dokumen.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('divisi_id', this.uploadForm.value.divisi_id);
    formData.append('no_surat', this.uploadForm.value.no_surat);
    formData.append('tgl_surat', this.uploadForm.value.tgl_surat);
    formData.append('perihal', this.uploadForm.value.perihal);
    if (this.uploadForm.value.jenjang_pengawas) formData.append('jenjang_pengawas', this.uploadForm.value.jenjang_pengawas);
    formData.append('kategori', this.uploadForm.value.kategori);
    formData.append('klasifikasi', this.uploadForm.value.klasifikasi);
    formData.append('file_dokumen', this.uploadFile);

    this.facade.uploadArsip(formData);
  }
}
