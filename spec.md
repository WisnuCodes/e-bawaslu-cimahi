<div align="center">
  <h1>📐 Spesifikasi Sistem & Arsitektur Teknis</h1>
  <p><strong>Dokumen Acuan Inti (Core Blueprint) - SIM Bawaslu Kota Cimahi</strong></p>

  ![Architecture](https://img.shields.io/badge/Architecture-Modular_Monolith-8A2BE2?style=for-the-badge)
  ![Database](https://img.shields.io/badge/Database-PostgreSQL_15-4169E1?style=for-the-badge)
  ![Security](https://img.shields.io/badge/Security-Sanctum_%7C_SHA--256-000000?style=for-the-badge)
</div>

---

> **⚠️ PEMBERITAHUAN FASE PENGEMBANGAN**  
> Semua arsitektur dan spesifikasi API yang dijelaskan di dokumen ini saat ini baru diimplementasikan secara mutlak pada tingkat **Backend (Mesin API)**. Antarmuka Visual / *Frontend* (Angular) akan menyusul dibangun pada fase berikutnya, namun wajib mematuhi seluruh kontrak API yang tertulis di bawah ini.

---

## 🏗️ Ikhtisar Sistem

Sistem ini dirancang sebagai portal terpusat (*Central Hub*) berstandar *Enterprise* yang mengintegrasikan tiga pilar layanan kritikal di lingkungan Bawaslu Kota Cimahi:

1. 📍 **Sistem Presensi WFH**: Pelacakan kehadiran pegawai secara nirkabel dan pelaporan log kerja (*Daily Worklog*).
2. 🗃️ **Sistem Manajemen Arsip**: Sentralisasi dokumen digital dengan dukungan indeks metadata yang kuat.
3. 📊 **Sistem Rekapitulasi C1 (P2H)**: Modul spesifik untuk unggah form C1 Pemilu, dilengkapi verifikasi silang (*cross-check*) suara dan jaminan orisinalitas data (hashing kriptografi).

Sistem ini berdiri di atas arsitektur **Modular Monolith** demi mempertahankan pemisahan ranah bisnis (Domain-Driven) tanpa mengorbankan kepraktisan *deployment* pada server pemerintah.

---

## 🗄️ Arsitektur Basis Data (ERD)

Untuk mencegah eksploitasi peretasan melalui enumerasi ID *(ID Insecure Direct Object References)*, basis data dibangun **tanpa** Auto-Increment. Seluruh tabel menggunakan **UUID (varchar 36)** sebagai *Primary Key*.

Berikut adalah topologi tabel inti:
- 👥 `users` : Pusat kredensial pengguna, direlasikan secara ketat ke tabel presensi, arsip, dan rekam jejak.
- 🏢 `divisi` : Referensi hierarki struktural unit kerja.
- 📸 `presensi_wfh` : Perekam *timestamp* kedatangan/kepulangan lengkap dengan bukti tautan swafoto (*selfie*).
- 📝 `daily_worklog` : Laporan kegiatan spesifik yang wajib diisi oleh pengguna harian.
- 📂 `arsip_dokumen` : Repositori metadata nomor surat, tanggal, dan lokasi fisik berkas.
- 🗳️ `berkas_c1` : Menyimpan parameter pemilu, suara sah/tidak sah, checksum (SHA-256), serta *State Machine* (Persetujuan/Penolakan).
- 🔐 `audit_log_trail` : *Buku Besar Kekal (Immutable Ledger)* yang merekam mutasi data guna keperluan audit forensik.

---

## 🔌 Spesifikasi Kontrak API (RESTful)

Seluruh layanan backend mengekspos API yang merespons dalam format JSON standar `(application/json)`. Akses rute tertutup (*protected routes*) dimediasi melalui otorisasi *Bearer Token* **Laravel 13 Sanctum**.

### 🛡️ Modul Autentikasi (IAM)
- `POST /api/login` : Autentikasi kredensial, mengembalikan token akses terenkripsi.
- `POST /api/logout` : Pencabutan sesi token secara instan (Revocation).

### 🏠 Modul Work From Home (WFH)
- `POST /api/wfh/checkin` : Perekaman kedatangan dengan injeksi foto masuk.
- `POST /api/wfh/checkout` : Perekaman kepulangan dengan injeksi foto keluar.
- `GET /api/wfh/worklogs` : Mengambil daftar aktivitas harian milik pengguna (*User-scoped*).
- `POST /api/wfh/worklogs` : Menambahkan log pekerjaan baru.

### 📑 Modul Manajemen Arsip
- `GET /api/arsip` : Pengambilan katalog arsip digital.
- `POST /api/arsip` : Registrasi dokumen baru dengan metadata Bawaslu.

### 🗳️ Modul P2H (Form C1)
- `GET /api/c1` : Mengambil daftar rekapitulasi C1 terunggah.
- `POST /api/c1` : Pengunggahan berkas C1, perhitungan integritas **SHA-256**, dan kalkulasi kecocokan *Total Suara* secara otomatis.
- `POST /api/c1/{id}/approve` : Transisi *State Machine* untuk menyetujui atau menolak dokumen C1.

---

## 🔒 Standar Keamanan & Integritas Data

Sistem ini mematuhi protokol keamanan data yang ketat:

1. **Kriptografi Lapis Ganda**: 
   - Kata sandi dilindungi algoritma **Bcrypt**.
   - Dokumen krusial (seperti form C1) dikalkulasi menggunakan **SHA-256** *(Duplicate Upload Prevention)* untuk menghindari manipulasi hasil suara di tingkat *database*.
2. **Immutable Audit Trail**: 
   - Melalui `AuditTrailMiddleware`, setiap permintaan manipulasi data (`POST`, `PUT`, `DELETE`) disadap pada tingkat proksi HTTP. Segala bentuk perubahan akan tercatat ke dalam tabel `audit_log_trail` (mencakup Aktor, IP Address, Waktu, dan Potongan *Payload*) sebelum diproses oleh sistem utama.
3. **Penyimpanan Objek Netral**: 
   - Konfigurasi sistem penyimpanan (*Filesystem*) dirancang sedemikian rupa agar siap menerima adaptor **MinIO (S3)** guna melepaskan beban I/O dari memori server lokal.
