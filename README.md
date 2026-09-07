# E-Bawaslu Cimahi
Sistem Informasi Manajemen Arsip, Presensi WFH, dan Rekapitulasi C1 - Pilot Project Bawaslu Kota Cimahi.

## Kebutuhan Fungsional (Sesuai SRS Bab III)

Aplikasi ini mencakup 6 modul utama dan 1 modul khusus sesuai Spesifikasi Kebutuhan Perangkat Lunak (SRS):

- **Modul 1: Manajemen Arsip & Dokumen Digital Internal Divisi**
  - `FR-ARC-01`: Klasifikasi & Pengindeksan Berkas / Metadata Engine
  - `FR-ARC-02`: OCR & Full-Text Search
  - `FR-ARC-03`: Controls File Versioning & Locking
  - `FR-ARC-04`: Dynamic Watermarking
  - `FR-ARC-05`: Upload & Pengelolaan Berkas C1
- **Modul 2: Absensi WFH & Monitoring Aktivitas Pegawai**
  - `FR-ABS-01`: Presensi WFH Check-In & Check-Out
  - `FR-ABS-02`: Daily Worklog / Laporan Aktivitas Harian
  - `FR-ABS-03`: Dashboard Rekapitulasi & Kalkulasi Jam Kerja
- **Modul 3: Engine Persetujuan / Approval Workflow**
  - `FR-APP-01`: Multi-Tier Approval
  - `FR-APP-02`: Notifikasi Real-Time & Cross-Channel
- **Modul 4: Audit Trail & Observabilitas Keamanan**
  - `FR-AUD-01`: Immutable Log Trail
  - `FR-AUD-02`: Logging Aktivitas Berkas Sensitif
  - `FR-AUD-03`: Dashboard Pemantauan Anomali
- **Modul 5: Keamanan & Akses Terpusat**
  - `FR-SEC-01`: Access Control - RBAC & ABAC
  - `FR-SEC-02`: Keycloak SSO & MFA
- **Modul 6: Laporan & Dashboard Eksekutif**
  - `FR-REP-01`: Real-Time Executive Dashboard
  - `FR-REP-02`: Automated Export
- **Modul Khusus: Rekapitulasi Keseluruhan Hasil Suara C1**
  - `FR-REC-01`: Agregasi Berjenjang Otomatis
  - `FR-REC-02`: Auto Cross-Check Validation & Red Flag
  - `FR-REC-03`: Live Progress Bar

## Arsitektur
- **Backend**: Laravel 11 (Modular Monolith)
- **Frontend**: Angular 17 (Standalone Components)
- **Database**: PostgreSQL
- **Keamanan**: Keycloak (SSO) & Sanctum

## Panduan Instalasi (Development)
1. Clone repositori ini.
2. Setup Backend:
   ```bash
   cd e-bawaslu-api
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate:fresh --seed
   php artisan serve
   ```
3. Setup Frontend:
   ```bash
   cd e-bawaslu-web
   npm install
   npm run start
   ```

Lihat [spec.md](./spec.md) untuk rincian Spesifikasi Kebutuhan Perangkat Lunak.

## Kamar Pemilu, Pilkada, dan LHP

- Ketua dan Superadmin dapat membuka Form C1 dan LHP pada kedua kamar melalui sidebar.
- LHP tersedia untuk seluruh divisi. Ketua/Superadmin menambahkan tahapan beserta divisi pembimbing di halaman LHP; divisi laporan mengikuti tahapan yang dipilih.
- Verifikasi Calon dan Verifikasi Administrasi dapat ditambahkan sesuai pembagian tugas. Penetapan Caleg wajib menggunakan divisi Penyelesaian Sengketa.
- Kamar Pilkada mendukung Form C1 Wali Kota. Daftar dan rekap C1 dipisahkan menurut kamar.
- Dokumen LHPP lama tetap terlihat sebagai LHP. Data lama tanpa jenis pemilihan ditampilkan di Kamar Pemilu; tahapan lama yang kosong ditandai “Belum ditentukan”.
- Setelah memperbarui kode, jalankan `php artisan migrate` dari direktori `e-bawaslu-api` untuk menambahkan metadata kamar dan tahapan pada arsip.

## Akses Pengawas Lapangan

- Admin dapat memilih peran Panwascam, PKD, PTPS, Kepala Divisi, dan Ketua pada Konfigurasi User.
- Panwascam, PKD, dan PTPS dapat mengunggah/mengunduh E-Arsip dan C1. Akun bertanda Tamu hanya dapat membaca/mengunduh.
- Untuk MHP, pilih kategori **MHP** dan **Jenjang Pengawas** (Panwascam/PKD/PTPS). Jenjang juga tersedia sebagai filter E-Arsip, terpisah dari klasifikasi keamanan dokumen.
- Isi URL PPID (HTTP/HTTPS) pada pengguna untuk menampilkan tautan **PPID** di sidebar.
- Admin wajib mengisi titik acuan rumah atau kantor berupa `latitude, longitude` pada pengguna. Check-in/out dibatasi radius **1 km**; akun lama tanpa titik acuan perlu dilengkapi sebelum presensi.
- Filter Kecamatan → Kelurahan → TPS tersedia di kedua kamar C1. Tombol unduh mengambil dokumen asli melalui API terautentikasi dan mencatat audit.
- Admin memilih **Divisi Approval** pada masing-masing baris C1. Kepala divisi yang ditunjuk dapat menyetujui/menolak C1 berstatus Draft; staf tidak dapat melakukan approval. Pimpinan tetap dapat melakukan approval. C1 yang sudah disetujui tidak dapat diedit.

## LHP Lapangan dan Viewer Persuratan

- Form LHP menerima satu dokumen atau foto (PDF/DOC/DOCX/JPG/PNG, maksimal 5 MB), dengan pratinjau foto sebelum dikirim dan notifikasi setelah unggahan berhasil.
- LHP menyediakan maksimal tiga catatan kejadian khusus dan kondisi kotak suara. Isian ini opsional, tersimpan bersama arsip LHP, dan dapat dibaca melalui rincian pada tabel laporan.
- PTPS, Panwascam, dan PKD dapat mengunggah LHP sesuai tahapan yang disediakan Ketua/Superadmin.
- Pilih **Panwascam (Tamu) — Viewer** pada Konfigurasi User untuk akses melihat/mengunduh persuratan dan LHP tanpa upload, revisi, atau hapus.
- Menu **Persuratan** menampilkan Surat Masuk, Surat Keluar, Surat Keputusan, dan Nota Dinas dari E-Arsip.
- Notifikasi berhasil upload ditampilkan di aplikasi kepada pengunggah; fitur ini tidak mengirim pemberitahuan ke pihak lain.
