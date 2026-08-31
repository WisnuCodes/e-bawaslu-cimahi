import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../../core/services/user/user.service';

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
export class StrukturOrganisasiComponent implements OnInit {
  private userService = inject(UserService);
  // Pimpinan Pleno
  ketua = {
    nama: 'FATHIR RIZKIA LATIF, S.H.',
    jabatan: 'Ketua Bawaslu Kota Cimahi',
    role: 'Ketua',
    foto: 'https://ui-avatars.com/api/?name=Fathir+Rizka+Latif&background=1e3a8a&color=fff&size=150',
    warnaHeader: '#1e3a8a'
  };

  kordivList = [
    {
      nama: 'AHMAD HIDAYAT, SHI., M.M.',
      jabatan: 'Koordinator Divisi SDM, Organisasi dan Diklat',
      role: 'Anggota',
      divisi: 'SDMOD',
      foto: 'https://ui-avatars.com/api/?name=Ahmad+Hidayat&background=1d4ed8&color=fff&size=150',
      warnaHeader: '#1d4ed8'
    },
    {
      nama: 'JUSAPUANDY, S.IP.',
      jabatan: 'Koordinator Divisi Hukum dan Penyelesaian Sengketa',
      role: 'Anggota',
      divisi: 'HPS',
      foto: 'https://ui-avatars.com/api/?name=Jusapuandy&background=2563eb&color=fff&size=150',
      warnaHeader: '#2563eb'
    },
    {
      nama: 'ZAENAL GINAN, S.PD.,M.I.POL.',
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
    nama: 'SETA DEWA NUGROHO, S.STP., M.Si.',
    nip: 'NIP. 19890919 200804 1 001',
    jabatan: 'Kepala Sekretariat Bawaslu Kota Cimahi',
    foto: 'https://ui-avatars.com/api/?name=Sita+Dewanur+Nugroho&background=15803d&color=fff&size=150'
  };

  bendahara = {
    nama: 'SUNDARI EKA GUSTINA, S.E.',
    jabatan: 'Bendahara Pengeluaran Pembantu',
    foto: 'https://ui-avatars.com/api/?name=Sundari+Eka+Gayatri&background=ca8a04&color=fff&size=150'
  };

  // 4 Divisi Sub-Bagian Staff
  divisiStaff = [
    {
      namaDivisi: 'Sub-Bagian SDM, Organisasi dan Diklat',
      kode: 'SDMOD',
      staf: [
        { nama: 'HANIFAH NUR, S.PT.', role: 'Staf' },
        { nama: 'MERA SEPTANI R, S.M.', role: 'Staf' },
        { nama: 'ADERAHMAN, S.E.', role: 'Staf' },
        { nama: 'ADISTI NURUL FITRI, A.MD.BNS.', role: 'Staf' },
        { nama: 'SIDIK PERMANA', role: 'Staf' },
        { nama: 'NUR QOMARIS S., S.IP', role: 'Staf' }
      ]
    },
    {
      namaDivisi: 'Divisi Penindakan Pelanggaran, Data dan Informasi',
      kode: 'PP DATIN',
      staf: [
        { nama: 'ZAELANI, S.H.,M.H.', role: 'Staf' },
        { nama: 'NURUL MAS ULAH', role: 'Staf' },
        { nama: 'YANUAR BAYU RAMADAN, S.AP.', role: 'Staf' }
      ]
    },
    {
      namaDivisi: 'Sub-Bagian Hukum dan Penyelesaian Sengketa',
      kode: 'HPS',
      staf: [
        { nama: 'NICHOLAS ABELARDOM M.,S.H.', role: 'Staf' },
        { nama: 'MOCH.ASSADILLAH, S.H.', role: 'Staf' }
      ]
    },
    {
      namaDivisi: 'Sub-Bagian Pencegahan, Parmas dan Humas',
      kode: 'P2H',
      staf: [
        { nama: 'ARTHUR RACHMAN, S.H.', role: 'Staf' },
        { nama: 'AGAM ZUAMA, S.SOS', role: 'Staf' },
        { nama: 'GUNAWAN KUSMANTORO, S.IP.,M.H', role: 'Staf' },
        { nama: 'PUTRA IDAMBA', role: 'Staf' }
      ]
    }
  ];

  stafPendukung = [
    { nama: 'MUHAMMAD MUSLIM, M.Pd.', role: 'Staf Pendukung' },
    { nama: 'DIKA NUGRAHA, S.H.', role: 'Staf Pendukung' },
    { nama: 'ADE HAYATI', role: 'Staf Pendukung' }
  ];

  adhoc = [
    { nama: 'Panwaslu Kecamatan Cimahi Tengah', wilayah: 'Cimahi, Baros, Cigugur Tengah, Karangmekar, Padasuka, Setiamanah' },
    { nama: 'Panwaslu Kecamatan Cimahi Selatan', wilayah: 'Cibeber, Cibeureum, Leuwigajah, Melong, Utama' },
    { nama: 'Panwaslu Kecamatan Cimahi Utara', wilayah: 'Cipageran, Citeureup, Pasirkaliki' }
  ];

  ngOnInit() {
    this.syncWithUserConfig();
  }

  syncWithUserConfig() {
    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const users = res.data;
          
          // Sinkronisasi Ketua Bawaslu
          const ketuaUser = users.find(u => u.role?.toUpperCase().includes('KETUA'));
          if (ketuaUser) {
            this.ketua.nama = ketuaUser.username.toUpperCase();
            this.ketua.foto = `https://ui-avatars.com/api/?name=${encodeURIComponent(ketuaUser.username)}&background=1e3a8a&color=fff&size=150`;
          }

          // Sinkronisasi Kordiv / Anggota
          this.kordivList.forEach(kordiv => {
             const match = users.find(u => 
               u.nama_divisi?.toUpperCase().includes(kordiv.divisi.toUpperCase()) && 
               (u.role?.toUpperCase().includes('KORDIV') || u.role?.toUpperCase().includes('ANGGOTA') || u.role?.toUpperCase().includes('KOMISIONER'))
             );
             
             if (match) {
               kordiv.nama = match.username.toUpperCase();
               const bgWarna = kordiv.warnaHeader.replace('#', '');
               kordiv.foto = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.username)}&background=${bgWarna}&color=fff&size=150`;
             }
          });
        }
      },
      error: (err) => {
        console.error('Gagal mengambil data user untuk sinkronisasi struktur organisasi', err);
      }
    });
  }
}
