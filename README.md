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
