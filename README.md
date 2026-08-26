<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Bawaslu_Logo.svg" alt="Bawaslu Logo" width="150" />
  
  <h1>🛡️ SIM Bawaslu Kota Cimahi</h1>
  <p><strong>Sistem Informasi Manajemen Presensi, Arsip, & Rekapitulasi C1 (P2H) Terpadu</strong></p>

  <p>
    <a href="https://angular.dev/"><img src="https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular"></a>
    <a href="https://php.net/"><img src="https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP"></a>
    <a href="https://laravel.com/"><img src="https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel"></a>
    <a href="https://postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
  </p>
</div>

---

## 📖 Deskripsi Proyek

Repositori ini memuat kode sumber ( *Fullstack* ) **Sistem Informasi Manajemen Bawaslu Kota Cimahi**. Sistem ini dirancang secara terpadu (*End-to-End*) untuk mengelola proses internal dengan performa tinggi. Arsitektur aplikasi dipisah secara modern (API berbasis **Laravel** dan *Single Page Application* berbasis **Angular**).

Layanan ini menangani seluruh logika bisnis kompleks, pengalaman pengguna (*User Experience*) yang interaktif dan *real-time*, hingga integritas dan keamanan data untuk tiga pilar utama:

- 🏢 **Modul Work From Home (WFH)**: Sistem Presensi *Check-In/Out* berbasis lokasi & Catatan Kerja Harian terintegrasi.
- 🗂️ **Modul Arsip Digital**: Manajemen dokumen persuratan dengan pelabelan metadata dan mesin pencarian efisien.
- 🗳️ **Modul P2H (Form C1)**: Pengawasan form C1 Pemilu & Algoritma Verifikasi Selisih Suara otomatis.

---

## ⚙️ Prasyarat Lingkungan (Environment Requirements)

Pastikan mesin Anda telah dilengkapi dengan dependensi berikut sebelum menjalankan proyek ini:

| Kebutuhan | Versi Minimal | Peruntukan / Keterangan |
| :--- | :---: | :--- |
| **Node.js** | `v18.x` | Menjalankan *environment* Frontend Angular |
| **Angular CLI** | `^17.x` | Membangun dan melayani ( *serve* ) UI |
| **PHP** | `^8.2` | Menjalankan mesin *Backend* |
| **Composer** | `^2.7` | Manajemen dependensi PHP |
| **PostgreSQL**| `^15` | Dukungan UUID & JSONB (*Ekstensi `pdo_pgsql` aktif*) |
| **MinIO/S3** | (Opsional) | Direkomendasikan untuk *Object Storage* (Arsip & Foto) |

---

## 🚀 Panduan Instalasi Cepat

Proyek ini terbagi menjadi 2 area kerja utama ( *workspace* ) yaitu `e-bawaslu-api` untuk *Backend* dan `e-bawaslu-web` untuk *Frontend*.

### 1️⃣ Konfigurasi Backend (Laravel)

Buka terminal dan arahkan ke direktori API:
```bash
cd e-bawaslu-api
```
1. Instal dependensi dan atur env:
   ```bash
   composer install
   cp .env.example .env
   ```
2. Atur kredensial *database* PostgreSQL pada berkas `.env` Anda.
3. *Generate* kunci enkripsi dan jalankan migrasi:
   ```bash
   php artisan key:generate
   php artisan migrate --seed
   ```
4. Jalankan *server backend*:
   ```bash
   php artisan serve
   # Server API berjalan di http://localhost:8000
   ```

### 2️⃣ Konfigurasi Frontend (Angular)

Buka tab terminal **baru** dan arahkan ke direktori Web:
```bash
cd e-bawaslu-web
```
1. Instal *Node modules*:
   ```bash
   npm install
   ```
2. Jalankan *Development Server* Angular:
   ```bash
   ng serve
   # Atau: npm run start
   ```
3. Buka *browser* dan akses aplikasi pada **`http://localhost:4200`** 🎉

---

## 📚 Dokumentasi Teknis & Spesifikasi (API Contract)

Untuk memahami arsitektur *Modular Monolith* di sisi API, model relasional (ERD), dan standar integritas data keamanan, silakan merujuk pada:
👉 **[`spec.md`](./spec.md)**

---

## 🤝 Standar Kontribusi (Contribution Guidelines)

- **Frontend (Angular)**: Ikuti standar penamaan *Component/Service*, hindari komponen gemuk, dan terapkan *Tailwind Utility Classes* dengan rapi.
- **Backend (Laravel)**: Wajib mematuhi **PSR-12**. Gunakan berkas migrasi baru (*alter table*) alih-alih merombak skema lama untuk konsistensi *Audit Trail*.
- **Pull Request**: Harap pastikan semua layanan berhasil di-*build* dan kode berjalan sempurna sebelum mengajukan integrasi.

<div align="center">
  <br>
  <i>Dipersembahkan dengan ❤️ untuk Demokrasi yang Lebih Baik</i>
</div>
