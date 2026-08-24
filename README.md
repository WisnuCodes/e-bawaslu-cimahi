<div align="center">
  <h1>🛡️ SIM Bawaslu Kota Cimahi (Backend)</h1>
  <p><strong>Sistem Informasi Manajemen Presensi, Arsip, & P2H Bawaslu Kota Cimahi</strong></p>

  ![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php&logoColor=white)
  ![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
</div>

---

> **⚠️ PEMBERITAHUAN PENTING (FASE PENGEMBANGAN)**  
> Repositori ini saat ini **HANYA** memuat infrastruktur **Backend (API)**. Modul **Frontend** (Antarmuka Pengguna) yang berbasis Angular 17+ akan **menyusul** dan dikembangkan secara terpisah pada repositori / fase selanjutnya (Fase 6). 

---

## 📖 Deskripsi Proyek

Repositori ini memuat kode sumber untuk layanan API (Backend) Sistem Informasi Manajemen Bawaslu Kota Cimahi. Sistem ini dibangun dengan arsitektur **Modular Monolith** untuk memastikan skalabilitas dan performa tinggi.

Layanan ini menangani seluruh logika bisnis, pemrosesan data, autentikasi berbasis Token (Sanctum), hingga penjagaan integritas dokumen (Hashing SHA-256) untuk tiga modul utama:
- 🏢 **Modul WFH**: Presensi Check-In/Out & Catatan Kerja Harian.
- 🗂️ **Modul Arsip**: Manajemen dokumen terindeks.
- 🗳️ **Modul C1 (P2H)**: Pengawasan form C1 & Algoritma Verifikasi Selisih Suara.

---

## ⚙️ Prasyarat Lingkungan (Requirements)

Sebelum melakukan instalasi, pastikan *server* atau lingkungan pengembangan (*local environment*) Anda telah terpasang:

- **PHP** `^8.2`
- **Composer** `^2.7`
- **PostgreSQL** `^15` (Wajib mengaktifkan ekstensi `pdo_pgsql`)
- **Ekstensi PHP**: OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath, Fileinfo
- **MinIO Server** (Opsional, untuk kompatibilitas *S3 Object Storage*)

---

## 🚀 Panduan Instalasi Lokal

Ikuti langkah-langkah berikut untuk mengonfigurasi dan menjalankan *Backend* di komputer lokal Anda:

1. **Instal Dependensi**  
   Unduh semua *library* pihak ketiga yang dibutuhkan:
   ```bash
   composer install
   ```

2. **Konfigurasi Environment**  
   Salin *file* konfigurasi bawaan dan sesuaikan nilainya:
   ```bash
   cp .env.example .env
   ```
   Buka *file* `.env` Anda, lalu atur kredensial *database* Anda seperti contoh berikut:
   ```ini
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=bawaslu_cimahi
   DB_USERNAME=postgres
   DB_PASSWORD=password_anda
   ```

3. **Hasilkan Kunci Enkripsi (Application Key)**  
   ```bash
   php artisan key:generate
   ```

4. **Jalankan Migrasi Database**  
   Membangun seluruh tabel ke dalam PostgreSQL Anda:
   ```bash
   php artisan migrate
   ```

5. **Nyalakan Server**  
   Jalankan server API lokal (secara bawaan akan berjalan di port `8000`):
   ```bash
   php artisan serve
   ```
   *Selamat! Backend API Anda kini berjalan di `http://localhost:8000`.*

---

## 📚 Dokumentasi Teknis Lanjutan

Untuk memahami arsitektur, spesifikasi teknis, model relasional (ERD), dan skema basis data secara lebih mendalam, silakan merujuk pada dokumen terpisah kami di: **[`spec.md`](./spec.md)**.

---

## 🤝 Standar Kontribusi

Setiap modifikasi kode sumber wajib mengikuti standar **PSR-12** untuk PHP. Sangat dilarang keras melakukan modifikasi tabel migrasi utama secara destruktif; selalu gunakan berkas migrasi baru (*alter table*) apabila terjadi penyesuaian logika bisnis di masa mendatang demi menjaga integritas *Audit Trail*.
