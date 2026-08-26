# SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK (SRS)
## SISTEM INFORMASI MANAJEMEN ARSIP, PRESENSI WFH, DAN REKAPITULASI C1
### BADAN PENGAWAS PEMILIHAN UMUM (BAWASLU) KOTA CIMAHI

---

## 1. PENDAHULUAN & RUANG LINGKUP (PROJECT SCOPE)

### 1.1 Profil & Wilayah Kerja (Pilot Project)
- **Instansi**: Badan Pengawas Pemilihan Umum (Bawaslu) Kota Cimahi.
- **Cakupan Wilayah Administratif**: Kota Cimahi (3 Kecamatan, 16 Kelurahan, TPS 001 – TPS N):
  1. **Kecamatan Cimahi Utara**: Kel. Cipageran, Kel. Citeureup, Kel. Pasirkaliki, Kel. Cibabat, Kel. Padaasih.
  2. **Kecamatan Cimahi Tengah**: Kel. Baros, Kel. Cigugur Tengah, Kel. Karangmekar, Kel. Setiamanah, Kel. Cimahi, Kel. Padasuka.
  3. **Kecamatan Cimahi Selatan**: Kel. Cibeber, Kel. Cibeureum, Kel. Leuwigajah, Kel. Melong, Kel. Utama.

---

## 2. KELAS PENGGUNA & HAK AKSES (USER CLASSES & RBAC / ABAC)

| Tingkat / Kelas | Deskripsi & Tanggung Jawab | Hak Akses (CRUD) | Restriksi / Batasan |
| :--- | :--- | :--- | :--- |
| **Kelas 1: Staf / Pegawai** | Staf pelaksana operasional divisi (SDM, Hukum, Sengketa, P2H, Sekretariat). Melakukan presensi WFH, daily worklog, unggah arsip internal, input C1 (Staf P2H). | **Create, Read, Update** (Draf/revisi pribadi & divisi) | ❌ Dilarang Delete.<br>❌ Dilarang Approval.<br>❌ Dilarang lihat audit log divisi lain. |
| **Kelas 2: Kepala Divisi / Kasubag / Kabag** | Penanggung jawab teknis divisi (Kordiv SDMOD, HPS, PP Datin, P2H, Bendahara). Verifikasi berkas, setujui worklog WFH staf divisi. | **Create, Read, Update, Soft Delete** (Lingkup divisi) | ❌ Dilarang Hard Delete.<br>❌ Dilarang ubah konfigurasi sistem global.<br>❌ Audit log terbatas internal divisi. |
| **Kelas 3: Administrator / Pimpinan** | Ketua & Anggota Komisioner Bawaslu serta Koordinator Sekretariat. Pengawasan organisasi, approval global, evaluasi hasil suara C1. | **Read, Update (Approval Global)** (Lintas Divisi & Executive Dashboard) | ❌ Dilarang Hard Delete tanpa Super Admin.<br>❌ Tidak mengelola infrastruktur IT. |
| **Kelas 4: Super Administrator** | Tim IT / Pengelola Sistem Utama Bawaslu. Pemeliharaan sistem, manajemen identitas, keamanan data, audit trail forensik, backup. | **Full Access (CRUD), Hard Delete, System Config** | ⚠️ Tindakan Hard Delete wajib mencantumkan alasan resmi dan terekam di Immutable Audit Trail. |

---

## 3. RINCIAN KEBUTUHAN FUNGSIONAL (FUNCTIONAL REQUIREMENTS)

### Modul 1: Manajemen Arsip & Dokumen Digital Internal Divisi
- **FR-ARC-01 (Klasifikasi & Pengindeksan Berkas / Metadata Engine)**: Pencatatan metadata terstruktur (No. Surat, Tanggal, Perihal, Kategori, Unit Kerja/Divisi, Klasifikasi Keamanan: *Biasa, Rahasia, Sangat Rahasia*).
- **FR-ARC-02 (OCR & Full-Text Search)**: Ekstraksi teks otomatis via Tesseract OCR dan pencarian teks instan di dalam isi berkas fisik via Elasticsearch.
- **FR-ARC-03 (Controls File Versioning & Locking)**: Pengelolaan riwayat revisi dokumen (*v1.0, v1.1*) dan penguncian (*locking*) berkas saat sedang disunting.
- **FR-ARC-04 (Dynamic Watermarking)**: Penempelan stempel air dinamis (Nama Pengunduh, NIP, Alamat IP, Server Timestamp) pada setiap berkas PDF terunduh.
- **FR-ARC-05 [FITUR KHUSUS P2H] Upload & Pengelolaan Berkas C1**: Pengunggahan lembar scan Model C1-Hasil per TPS terproteksi enkripsi storage AES-256 dan hash SHA-256 anti-tampering.

### Modul 2: Absensi WFH & Monitoring Aktivitas Pegawai
- **FR-ABS-01 (Presensi WFH Check-In & Check-Out)**: Pencatatan kehadiran mandiri berbasis server timestamp dan unggah foto swafoto fisik (tanpa AI biometrik).
- **FR-ABS-02 (Daily Worklog / Laporan Aktivitas Harian)**: Pengisian rincian tugas harian WFH, durasi pengerjaan, dan lampiran bukti output kerja.
- **FR-ABS-03 (Dashboard Rekapitulasi & Kalkulasi Jam Kerja)**: Penghitungan otomatis jam kerja efektif, akumulasi keterlambatan (potongan Rp 10.000/menit), dan rekapitulasi syarat Tunjangan Kinerja (Tukin).

### Modul 3: Engine Persetujuan / Approval Workflow
- **FR-APP-01 (Multi-Tier Approval)**: Alur persetujuan berjenjang hirarkis (*Staf → Kasubag → Kabag → Kordiv/Pimpinan*) dengan status *Approved / Rejected / Revision Needed*.
- **FR-APP-02 (Notifikasi Real-Time & Cross-Channel)**: Pemberitahuan seketika via in-app alert dan email saat ada pengajuan persetujuan.

### Modul 4: Audit Trail & Observabilitas Keamanan
- **FR-AUD-01 (Immutable Log Trail)**: Buku besar kekal read-only (*Who, What, On Which File, When, IP Address*).
- **FR-AUD-02 (Logging Aktivitas Berkas Sensitif)**: Perekaman prioritas tinggi saat terjadi akses/unduh/hapus berkas berklasifikasi Rahasia atau Sangat Rahasia.
- **FR-AUD-03 (Dashboard Pemantauan Anomali)**: Deteksi otomatis kejanggalan trafik/akses berbasis ambang batas (*threshold*).

### Modul 5: Keamanan & Akses Terpusat
- **FR-SEC-01 (Access Control - RBAC & ABAC)**: Penegakan aturan otorisasi berbasis Peran (*Role*) dan Divisi (*Attribute*).
- **FR-SEC-02 (Keycloak SSO & MFA)**: Otentikasi tunggal dengan verifikasi kode OTP 6-digit sebelum penerbitan JWT / Sanctum Token.

### Modul 6: Laporan & Dashboard Eksekutif
- **FR-REP-01 (Real-Time Executive Dashboard)**: Ringkasan statistik kehadiran WFH, *pending approval counter*, dan *Live Progress Bar* masukan Form C1.
- **FR-REP-02 (Automated Export)**: Ekspor dokumen rekapitulasi kehadiran, worklog, dan hasil suara ke format PDF resmi ber-watermark untuk keperluan audit BPK.

### [FITUR TAMBAHAN KHUSUS] Rekapitulasi Keseluruhan Hasil Suara C1
- **FR-REC-01 (Agregasi Berjenjang Otomatis)**: Penjumlahan otomatis suara sah, tidak sah, dan total pemilih secara hirarkis (*TPS → Kelurahan → Kecamatan → Kota Cimahi*).
- **FR-REC-02 (Auto Cross-Check Validation & Red Flag)**: Validasi konsistensi rumus matematika secara otomatis (`Suara Sah + Suara Tidak Sah == Total Pemilih`). Pemberian status **Red Flag Mismatch** jika terjadi selisih.
- **FR-REC-03 (Live Progress Bar)**: Pemantauan persentase jumlah berkas C1 yang telah masuk dan tervalidasi terhadap total TPS di Kota Cimahi.
