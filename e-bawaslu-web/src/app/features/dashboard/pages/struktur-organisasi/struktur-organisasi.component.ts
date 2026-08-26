import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-struktur-organisasi',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './struktur-organisasi.component.html',
  styleUrl: './struktur-organisasi.component.css'
})
export class StrukturOrganisasiComponent {
  // Pimpinan Pleno
  ketua = {
    nama: 'FATHIR RIZKA LATIF, S.H.',
    jabatan: 'Ketua Bawaslu Kota Cimahi',
    role: 'Ketua',
    foto: 'https://ui-avatars.com/api/?name=Fathir+Rizka+Latif&background=1e3a8a&color=fff&size=150',
    warnaHeader: '#1e3a8a'
  };

  kordivList = [
    {
      nama: 'AHMAD HIDAYAT, S.H.I., M.M.',
      jabatan: 'Koordinator Divisi SDM, Organisasi dan Diklat',
      role: 'Anggota',
      divisi: 'SDMOD',
      foto: 'https://ui-avatars.com/api/?name=Ahmad+Hidayat&background=1d4ed8&color=fff&size=150',
      warnaHeader: '#1d4ed8'
    },
    {
      nama: 'JUSAPUANDY, S.I.P.',
      jabatan: 'Koordinator Divisi Hukum dan Penyelesaian Sengketa',
      role: 'Anggota',
      divisi: 'HPS',
      foto: 'https://ui-avatars.com/api/?name=Jusapuandy&background=2563eb&color=fff&size=150',
      warnaHeader: '#2563eb'
    },
    {
      nama: 'ZAENAL GHAZALI, S.Pd.I., M.I.Pol.',
      jabatan: 'Koordinator Divisi Penanganan Pelanggaran, Data dan Informasi',
      role: 'Anggota',
      divisi: 'PP DATIN',
      foto: 'https://ui-avatars.com/api/?name=Zaenal+Ghazali&background=3b82f6&color=fff&size=150',
      warnaHeader: '#3b82f6'
    },
    {
      nama: 'AKHMAD YASIN NUGRAHA, S.H.',
      jabatan: 'Koordinator Divisi Pencegahan, Partisipasi Masyarakat dan Hubungan Masyarakat',
      role: 'Anggota',
      divisi: 'P2H',
      foto: 'https://ui-avatars.com/api/?name=Akhmad+Yasin&background=60a5fa&color=fff&size=150',
      warnaHeader: '#60a5fa'
    }
  ];

  // Sekretariat
  kasek = {
    nama: 'SITA DEWANUR NUGROHO, S.STP., M.Si.',
    nip: 'NIP. 19890919 200804 1 001',
    jabatan: 'Kepala Sekretariat Bawaslu Kota Cimahi',
    foto: 'https://ui-avatars.com/api/?name=Sita+Dewanur+Nugroho&background=15803d&color=fff&size=150'
  };

  bendahara = {
    nama: 'SUNDARI EKA GAYATRI, S.P.',
    jabatan: 'Bendahara Pengeluaran Pembantu',
    foto: 'https://ui-avatars.com/api/?name=Sundari+Eka+Gayatri&background=ca8a04&color=fff&size=150'
  };

  // 4 Divisi Sub-Bagian Staff
  divisiStaff = [
    {
      namaDivisi: 'Sub-Bagian SDM, Organisasi dan Diklat',
      kode: 'SDMOD',
      staf: [
        { nama: 'RISA NOVITASARI, S.AP.', role: 'Staf' },
        { nama: 'NENG SITI SALMA, S.H.', role: 'Staf' },
        { nama: 'ZAINURAHMAN, S.H.', role: 'Staf' },
        { nama: 'ADINDA AULIA FITRI, A.Md.Keb.', role: 'Staf' },
        { nama: 'ALFI RAMADHAN', role: 'Staf' },
        { nama: 'NENG SITI MARYAM, S.Pd.', role: 'Staf' }
      ]
    },
    {
      namaDivisi: 'Sub-Bagian Penanganan Pelanggaran, Data dan Informasi',
      kode: 'PP DATIN',
      staf: [
        { nama: 'JAUHARI, S.Kom., M.M.', role: 'Staf' },
        { nama: 'SITI KHOFIFAH, S.H.', role: 'Staf' },
        { nama: 'YOGAS PRASMANAJAYA, S.Sos.', role: 'Staf' }
      ]
    },
    {
      namaDivisi: 'Sub-Bagian Hukum dan Penyelesaian Sengketa',
      kode: 'HPS',
      staf: [
        { nama: 'NUGRAHA WAHYU WARDHANA, S.H.', role: 'Staf' },
        { nama: 'MOCH. ADITYA UTAMA, S.H.', role: 'Staf' }
      ]
    },
    {
      namaDivisi: 'Sub-Bagian Pencegahan, Parmas dan Humas',
      kode: 'P2H',
      staf: [
        { nama: 'MOCH. AKBAR PAJRI, S.H.', role: 'Staf' },
        { nama: 'PANJI ASY\'ARI, S.Sos.', role: 'Staf' },
        { nama: 'DENI WAHYUDI PRASETYO, S.IP., M.H.', role: 'Staf' },
        { nama: 'AJENG DIMAS', role: 'Staf' }
      ]
    }
  ];

  stafPendukung = [
    { nama: 'MUHAMMAD FIRMANSYAH, S.Pd.', role: 'Staf Pendukung' },
    { nama: 'DIAN NURUL FAZRI', role: 'Staf Pendukung' },
    { nama: 'NIDA HAYATI', role: 'Staf Pendukung' }
  ];

  adhoc = [
    { nama: 'Panwaslu Kecamatan Cimahi Tengah', wilayah: 'Cimahi, Baros, Cigugur Tengah, Karangmekar, Padasuka, Setiamanah' },
    { nama: 'Panwaslu Kecamatan Cimahi Selatan', wilayah: 'Cibeber, Cibeureum, Leuwigajah, Melong, Utama' },
    { nama: 'Panwaslu Kecamatan Cimahi Utara', wilayah: 'Cipageran, Citeureup, Pasirkaliki' }
  ];
}
