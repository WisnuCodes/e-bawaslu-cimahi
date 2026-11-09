import { A11yModule } from '@angular/cdk/a11y';
import { Component, inject, ViewChild, ElementRef, OnInit, effect, untracked } from '@angular/core';
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
    A11yModule,
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
  templateUrl: './arsip-upload.component.html',
  styleUrls: ['../../arsip-modal.shared.css', './arsip-upload.component.css']
})
export class ArsipUploadComponent implements OnInit {
  public facade = inject(ArsipFacade);
  private fb = inject(FormBuilder);

  @ViewChild('uploadFileInput') uploadFileInput!: ElementRef<HTMLInputElement>;

  uploadForm: FormGroup;
  uploadFile: File | null = null;
  fileError = '';

  kategoriList = ['Surat Keputusan', 'Surat Masuk', 'Surat Keluar', 'Berita Acara', 'Nota Dinas', 'Laporan Pengawasan', 'MHP'];
  klasifikasiList = ['Biasa', 'Penting', 'Rahasia', 'Sangat Rahasia'];
  jenjangList = ['Panwascam', 'PKD', 'PTPS'];

  constructor() {
    this.uploadForm = this.fb.group({
      divisi_id: ['', Validators.required],
      divisi_tujuan: [null],
      pengirim: [''],
      no_surat: ['', Validators.required],
      tgl_surat: [new Date().toISOString().split('T')[0], Validators.required],
      perihal: ['', Validators.required],
      kategori: ['Surat Keputusan', Validators.required],
      jenjang_pengawas: [''],
      klasifikasi: ['Biasa', Validators.required]
    });

    effect(() => {
      if (this.facade.showUploadModal()) {
        untracked(() => {
          setTimeout(() => {
            const auth = this.facade.authService;
            const divisiList = this.facade.divisiList();
            this.uploadForm.reset({
              divisi_id: divisiList.length > 0 ? divisiList[0].divisi_id : '',
              divisi_tujuan: null,
              pengirim: '',
              no_surat: '',
              tgl_surat: new Date().toISOString().split('T')[0],
              perihal: '',
              kategori: 'Surat Keputusan',
              jenjang_pengawas: auth.isSaksiTps ? 'PTPS' : (auth.userRole.toLowerCase().includes('panwascam') ? 'Panwascam' : (auth.userRole.toLowerCase().includes('pkd') ? 'PKD' : '')),
              klasifikasi: 'Biasa'
            });
            this.uploadFile = null;
            this.fileError = '';
          });
        });
      }
    });
  }

  ngOnInit(): void {}

  onUploadFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.uploadFile = null;
    this.fileError = '';
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const ext = fileName.split('.').pop() || '';

    // Menolak file format exe, zip, dan executable / archive lainnya
    if (['zip', 'exe', 'rar', '7z', 'tar', 'gz', 'bat', 'cmd', 'sh', 'bin', 'msi', 'com'].includes(ext)) {
      this.fileError = `Format berkas tidak didukung. Sistem menolak pemilihan file berkas .${ext}. Berkas arsip tidak boleh berupa arsip terkompresi (.zip) atau berkas program/executable (.exe). Harap unggah dokumen dengan format PDF, DOC, DOCX, JPG, atau PNG.`;
      input.value = '';
      this.facade.showNotification(`Format berkas tidak didukung: Pemilihan file .${ext} ditolak oleh sistem.`, 'error');
      return;
    }

    // Validasi format dokumen yang diizinkan (PDF, DOC, DOCX, JPG, JPEG, PNG)
    if (!/\.(pdf|docx?|jpe?g|png)$/i.test(file.name)) {
      this.fileError = 'Format berkas tidak didukung. Harap pilih dokumen dengan format PDF, DOC, DOCX, JPG, atau PNG.';
      input.value = '';
      this.facade.showNotification('Format berkas tidak didukung. Harap gunakan format berkas dokumen resmi.', 'error');
      return;
    }

    // Validasi batas ukuran file (maks 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      this.fileError = 'Ukuran berkas melebihi batas maksimal 5 MB.';
      input.value = '';
      this.facade.showNotification('Ukuran berkas melebihi batas maksimal 5 MB.', 'error');
      return;
    }

    this.uploadFile = file;
  }

  submitUpload() {
    if (this.facade.isUploading()) return;

    if (!this.uploadFile) {
      this.facade.showNotification('Mohon lengkapi semua field dan sertakan file dokumen yang valid.', 'error');
      return;
    }

    const fileName = this.uploadFile.name.toLowerCase();
    const ext = fileName.split('.').pop() || '';
    if (['zip', 'exe'].includes(ext) || !/\.(pdf|docx?|jpe?g|png)$/i.test(this.uploadFile.name)) {
      this.fileError = 'Format berkas tidak didukung. Berkas format .zip atau .exe ditolak oleh sistem.';
      this.facade.showNotification('Format berkas tidak didukung. Unggahan ditolak.', 'error');
      return;
    }

    if (this.uploadForm.invalid || (this.uploadForm.value.kategori === 'MHP' && !this.uploadForm.value.jenjang_pengawas)) {
      this.facade.showNotification('Mohon lengkapi semua field dan sertakan file dokumen.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('divisi_id', this.uploadForm.value.divisi_id);
    if (this.uploadForm.value.divisi_tujuan) formData.append('divisi_tujuan', this.uploadForm.value.divisi_tujuan);
    if (this.uploadForm.value.pengirim) formData.append('pengirim', this.uploadForm.value.pengirim);
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
