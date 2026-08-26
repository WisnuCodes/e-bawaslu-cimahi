<div align="center">
  <h1>📐 Spesifikasi Sistem & Arsitektur Teknis</h1>
  <p><strong>Dokumen Acuan Inti (Core Blueprint) - SIM Bawaslu Kota Cimahi</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Frontend-Angular_17+-DD0031?style=for-the-badge" alt="Frontend">
    <img src="https://img.shields.io/badge/Backend-Laravel_Modular_Monolith-8A2BE2?style=for-the-badge" alt="Backend">
    <img src="https://img.shields.io/badge/Database-PostgreSQL_15-4169E1?style=for-the-badge" alt="Database">
  </p>
</div>

---

## 🏗️ Ikhtisar Arsitektur (System Overview)

Sistem ini didesain berlandaskan prinsip *Decoupled Architecture*, memisahkan antarmuka pengguna *(Frontend)* dengan layanan pemrosesan data *(Backend API)* untuk memungkinkan skalabilitas independen di lingkungan kerja Bawaslu Kota Cimahi.

1. **Frontend (Angular)**: Bertindak sebagai *Single Page Application* (SPA) dengan pemisahan komponen cerdas, sistem modular *routing*, interseptor HTTP untuk *Token Injection*, serta visual dinamis menggunakan TailwindCSS.
2. **Backend (Laravel API)**: Menjadi *Central Hub* berskema **Modular Monolith** guna mengorkestrasi keamanan logika bisnis spesifik, seperti penjagaan integritas swafoto lokasi presensi, *indexing* mesin arsip, dan komputasi silang keaslian data suara.

---

## 🗄️ Topologi Basis Data & Skema (Backend)

Demi mengantisipasi celah keamanan *IDOR (Insecure Direct Object References)*, basis data **TIDAK MENGGUNAKAN** pengenal Auto-Increment tradisional. Seluruh tabel inti diinisialisasi menggunakan **UUIDv4 (varchar 36)**.

### Model Relasional Utama:

| Tabel | Deskripsi & Peran | Kunci Tamu (Foreign Key) |
| :--- | :--- | :--- |
| `users` | Entitas pengguna pusat, mengelola kredensial dan hak akses (RBAC). | `divisi_id` |
| `divisi` | Referensi struktur hierarki unit kerja. | - |
| `presensi_wfh`| Catatan absensi dengan presisi *timestamp* dan *attachment* swafoto. | `user_id` |
| `daily_worklog`| Laporan rincian kegiatan kerja harian spesifik tiap entitas pengguna. | `user_id`, `presensi_id` |
| `arsip_dokumen`| Repositori arsip tersentralisasi berikut lokasi penempatan fisik & digital. | `uploader_id` |
| `berkas_c1` | Modul Pemilu: parameter suara, checksum (SHA-256), *State Machine* C1. | `petugas_id` |
| `audit_log_trail`| **Immutable Ledger**. Mencatat log Aktor, IP, endpoint, dan *payload*. | `user_id` (opsional) |

---

## 🔌 Spesifikasi Kontrak RESTful API (Konektor)

Klien (Angular) berkomunikasi secara murni ke API menggunakan HTTP. Payload pertukaran dan respons wajib menggunakan format `application/json`.
Seluruh rute terproteksi (Protected Routes) dimediasi melalui injeksi HTTP Interceptor Angular untuk header: `Authorization: Bearer <token>`.

### 🛡️ 1. Identity & Access Management (IAM)
| Endpoint | Method | Deskripsi Fungsionalitas |
| :--- | :---: | :--- |
| `/api/login` | `POST` | Klien mengirim *form* autentikasi. API mengembalikan *Access Token*. |
| `/api/logout` | `POST` | Klien menghapus token sesi lokal; API menggugurkan token di server. |

### 🏠 2. Work From Home (WFH) & Presensi
| Endpoint | Method | Deskripsi Fungsionalitas |
| :--- | :---: | :--- |
| `/api/wfh/checkin` | `POST` | Klien mengirimkan koordinat GeoLocation & *File* Base64 Foto Masuk. |
| `/api/wfh/checkout`| `POST` | Perekaman *timestamp* kepulangan (wajib setelah Check-In). |
| `/api/wfh/worklogs`| `GET` | Aplikasi menarik (*fetch*) daftar log kerja harian pengguna. |
| `/api/wfh/worklogs`| `POST` | Pencatatan entitas rincian kegiatan harian yang diketik di *UI*. |

### 📑 3. Arsip Digital & Sentralisasi Dokumen
| Endpoint | Method | Deskripsi Fungsionalitas |
| :--- | :---: | :--- |
| `/api/arsip` | `GET` | Penarikan data katalog arsip (didukung *Query Parameter* / Pencarian). |
| `/api/arsip` | `POST` | *Multipart Upload* arsip fisik PDF/DOCX beserta metadatanya. |

### 🗳️ 4. Pengawasan C1 (P2H)
| Endpoint | Method | Deskripsi Fungsionalitas |
| :--- | :---: | :--- |
| `/api/c1` | `GET` | Agregasi dokumen C1 yang telah dilaporkan. |
| `/api/c1` | `POST` | Ingesti C1: Kalkulasi kecocokan *Total Suara* & pembuatan **SHA-256** checksum. |
| `/api/c1/{id}/approve` | `POST` | Transisi status persetujuan dokumen pada dasbor manajemen. |

---

## 🔒 Postur Keamanan & Integritas Data Sistem

Integrasi lapisan antar kedua teknologi (Angular & Laravel) ditopang dengan prinsip pengamanan holistik:

1. **Proteksi Kriptografi Data**: 
   - Sandi (*Password*) di *hash* menggunakan mesin **Bcrypt**.
   - Keaslian berkas penting (Form C1) dikunci lewat kalkulasi **SHA-256** ketika Frontend melakukan *upload*. Berfungsi ganda untuk mencegah duplikasi unggah maupun perubahan fisik (*tampering*).
2. **Immutable Audit Trail (Buku Besar Audit)**: 
   - Middleware API menyadap seluruh *state-mutating request* (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Alamat IP, *User-Agent* Angular Klien, dan potongan muatan (*Payload*) direkam abadi untuk keperluan forensik *(Non-Repudiation)*.
3. **Penyimpanan Objek Skalabilitas Tinggi**: 
   - Semua *file blob* (Foto swafoto, Arsip) dikonfigurasi melalui abstraksi Filesystem Laravel untuk diarahkan ke kompartemen S3/MinIO. Node backend bisa dikembangkan horizontal tanpa kendala sinkronisasi aset *file*.

