<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database strictly based on the SRS & Bagan Organisasi Bawaslu Kota Cimahi.
     */
    public function run(): void
    {
        // 1. Seed Divisi Internal (Sesuai SRS 1.3 & 2.1)
        $divisiData = [
            'PLENO' => [
                'id' => (string) Str::uuid(),
                'nama' => 'Pimpinan & Anggota Komisioner',
                'deskripsi' => 'Ketua dan Anggota Komisioner Bawaslu Kota Cimahi'
            ],
            'SEKRETARIAT' => [
                'id' => (string) Str::uuid(),
                'nama' => 'Sekretariat & Tata Usaha',
                'deskripsi' => 'Koordinator Sekretariat, Administrasi Umum, dan Keuangan'
            ],
            'SDMOD' => [
                'id' => (string) Str::uuid(),
                'nama' => 'Divisi SDM, Organisasi, Pendidikan & Pelatihan',
                'deskripsi' => 'Pengelolaan Presensi WFH, Daily Worklog, dan Rekapitulasi Tukin Pegawai'
            ],
            'PPDATIN' => [
                'id' => (string) Str::uuid(),
                'nama' => 'Divisi Penanganan Pelanggaran & Data Informasi',
                'deskripsi' => 'Penanganan Pelanggaran Pemilu, Pengelolaan Data dan Sistem Informasi'
            ],
            'HPS' => [
                'id' => (string) Str::uuid(),
                'nama' => 'Divisi Hukum & Penyelesaian Sengketa',
                'deskripsi' => 'Pengelolaan Dokumen Kajian Hukum dan Penanganan Sengketa Proses Pemilu'
            ],
            'P2H' => [
                'id' => (string) Str::uuid(),
                'nama' => 'Divisi Pencegahan, Partisipasi Masyarakat, dan Humas (P2H)',
                'deskripsi' => 'Pengelolaan & Validasi Berkas C1-Hasil, Pengawasan Partisipatif, dan Hubungan Masyarakat'
            ],
            'PENDUKUNG' => [
                'id' => (string) Str::uuid(),
                'nama' => 'Unit Staf Pendukung & Pengawas Ad-Hoc',
                'deskripsi' => 'Staf Pendukung Operasional Kantor, Panwascam (Kecamatan), dan PKD (Kelurahan)'
            ],
            'IT' => [
                'id' => (string) Str::uuid(),
                'nama' => 'Pusat Data & Infrastruktur IT',
                'deskripsi' => 'Super Administrator Pengelola Sistem dan Keamanan Informasi Bawaslu'
            ]
        ];

        foreach ($divisiData as $key => $div) {
            $existing = DB::table('divisi')->where('nama_divisi', $div['nama'])->first();
            if ($existing) {
                $divisiData[$key]['id'] = $existing->divisi_id;
                DB::table('divisi')->where('divisi_id', $existing->divisi_id)->update([
                    'deskripsi' => $div['deskripsi']
                ]);
            } else {
                DB::table('divisi')->insert([
                    'divisi_id' => $div['id'],
                    'nama_divisi' => $div['nama'],
                    'deskripsi' => $div['deskripsi'],
                    'created_at' => now()
                ]);
            }
        }

        // 2. Seed Wilayah Pilot Project (Sesuai SRS 1.3 & 2.1: 3 Kecamatan, 16 Kelurahan, TPS)
        $tpsData = [
            // Kecamatan Cimahi Utara (5 Kelurahan)
            ['kecamatan' => 'Cimahi Utara', 'kelurahan' => 'Cipageran', 'no_tps' => 1],
            ['kecamatan' => 'Cimahi Utara', 'kelurahan' => 'Cipageran', 'no_tps' => 2],
            ['kecamatan' => 'Cimahi Utara', 'kelurahan' => 'Citeureup', 'no_tps' => 5],
            ['kecamatan' => 'Cimahi Utara', 'kelurahan' => 'Pasirkaliki', 'no_tps' => 8],
            ['kecamatan' => 'Cimahi Utara', 'kelurahan' => 'Cibabat', 'no_tps' => 10],
            ['kecamatan' => 'Cimahi Utara', 'kelurahan' => 'Padaasih', 'no_tps' => 12],

            // Kecamatan Cimahi Tengah (6 Kelurahan)
            ['kecamatan' => 'Cimahi Tengah', 'kelurahan' => 'Baros', 'no_tps' => 1],
            ['kecamatan' => 'Cimahi Tengah', 'kelurahan' => 'Cigugur Tengah', 'no_tps' => 3],
            ['kecamatan' => 'Cimahi Tengah', 'kelurahan' => 'Karangmekar', 'no_tps' => 6],
            ['kecamatan' => 'Cimahi Tengah', 'kelurahan' => 'Setiamanah', 'no_tps' => 9],
            ['kecamatan' => 'Cimahi Tengah', 'kelurahan' => 'Cimahi', 'no_tps' => 14],
            ['kecamatan' => 'Cimahi Tengah', 'kelurahan' => 'Padasuka', 'no_tps' => 18],

            // Kecamatan Cimahi Selatan (5 Kelurahan)
            ['kecamatan' => 'Cimahi Selatan', 'kelurahan' => 'Cibeber', 'no_tps' => 2],
            ['kecamatan' => 'Cimahi Selatan', 'kelurahan' => 'Cibeureum', 'no_tps' => 4],
            ['kecamatan' => 'Cimahi Selatan', 'kelurahan' => 'Leuwigajah', 'no_tps' => 7],
            ['kecamatan' => 'Cimahi Selatan', 'kelurahan' => 'Melong', 'no_tps' => 15],
            ['kecamatan' => 'Cimahi Selatan', 'kelurahan' => 'Utama', 'no_tps' => 20],
        ];

        foreach ($tpsData as $tps) {
            $existing = DB::table('wilayah_tps')
                ->where('kecamatan', $tps['kecamatan'])
                ->where('kelurahan', $tps['kelurahan'])
                ->where('no_tps', $tps['no_tps'])
                ->first();

            if (!$existing) {
                DB::table('wilayah_tps')->insert([
                    'tps_id' => (string) Str::uuid(),
                    'kecamatan' => $tps['kecamatan'],
                    'kelurahan' => $tps['kelurahan'],
                    'no_tps' => $tps['no_tps'],
                ]);
            }
        }

        // 3. Seed Users Sesuai 4 Kelas Pengguna (User Classes SRS 2.3)
        $defaultPassword = Hash::make('password');

        $users = [
            // KELAS 4: SUPER ADMINISTRATOR (Tim IT & Keamanan Sistem)
            [
                'username' => 'SUPER ADMIN IT BAWASLU',
                'email' => 'superadmin@cimahi.bawaslu.go.id',
                'role' => 'Super Administrator',
                'divisi_id' => $divisiData['IT']['id'],
            ],
            [
                'username' => 'admin_bawaslu',
                'email' => 'admin@bawaslu.go.id',
                'role' => 'Super Administrator',
                'divisi_id' => $divisiData['IT']['id'],
            ],

            // KELAS 3: ADMINISTRATOR / PIMPINAN (Ketua Komisioner & Koordinator Sekretariat)
            [
                'username' => 'FATHIR RIZKA LATIF, S.H.',
                'email' => 'ketua@cimahi.bawaslu.go.id',
                'role' => 'Ketua Bawaslu',
                'divisi_id' => $divisiData['PLENO']['id'],
            ],
            [
                'username' => 'SITA DEWANUR NUGROHO, S.STP., M.Si.',
                'email' => 'kasek@cimahi.bawaslu.go.id',
                'role' => 'Koordinator Sekretariat',
                'divisi_id' => $divisiData['SEKRETARIAT']['id'],
            ],

            // KELAS 2: KEPALA DIVISI / KASUBAG / KABAG (Penanggung Jawab Teknis Divisi)
            [
                'username' => 'AHMAD HIDAYAT, S.H.I., M.M.',
                'email' => 'ahmad.hidayat@cimahi.bawaslu.go.id',
                'role' => 'Kordiv SDMOD',
                'divisi_id' => $divisiData['SDMOD']['id'],
            ],
            [
                'username' => 'JUSAPUANDY, S.I.P.',
                'email' => 'jusapuandy@cimahi.bawaslu.go.id',
                'role' => 'Kordiv HPS',
                'divisi_id' => $divisiData['HPS']['id'],
            ],
            [
                'username' => 'ZAENAL GHAZALI, S.Pd.I., M.I.Pol.',
                'email' => 'zaenal.ghazali@cimahi.bawaslu.go.id',
                'role' => 'Kordiv PP Datin',
                'divisi_id' => $divisiData['PPDATIN']['id'],
            ],
            [
                'username' => 'AKHMAD YASIN NUGRAHA, S.H.',
                'email' => 'akhmad.yasin@cimahi.bawaslu.go.id',
                'role' => 'Kordiv P2H',
                'divisi_id' => $divisiData['P2H']['id'],
            ],
            [
                'username' => 'SUNDARI EKA GAYATRI, S.P.',
                'email' => 'bendahara@cimahi.bawaslu.go.id',
                'role' => 'Bendahara',
                'divisi_id' => $divisiData['SEKRETARIAT']['id'],
            ],

            // KELAS 1: STAF / PEGAWAI (Staf Pelaksana Operasional Per Divisi)
            // Staf SDMOD
            [
                'username' => 'RISA NOVITASARI, S.AP.',
                'email' => 'risa.novitasari@cimahi.bawaslu.go.id',
                'role' => 'Staf SDMOD',
                'divisi_id' => $divisiData['SDMOD']['id'],
            ],
            [
                'username' => 'NENG SITI SALMA, S.H.',
                'email' => 'neng.salma@cimahi.bawaslu.go.id',
                'role' => 'Staf SDMOD',
                'divisi_id' => $divisiData['SDMOD']['id'],
            ],
            [
                'username' => 'ZAINURAHMAN, S.H.',
                'email' => 'zainurahman@cimahi.bawaslu.go.id',
                'role' => 'Staf SDMOD',
                'divisi_id' => $divisiData['SDMOD']['id'],
            ],
            [
                'username' => 'ADINDA AULIA FITRI, A.Md.Keb.',
                'email' => 'adinda.aulia@cimahi.bawaslu.go.id',
                'role' => 'Staf SDMOD',
                'divisi_id' => $divisiData['SDMOD']['id'],
            ],
            [
                'username' => 'ALFI RAMADHAN',
                'email' => 'alfi.ramadhan@cimahi.bawaslu.go.id',
                'role' => 'Staf SDMOD',
                'divisi_id' => $divisiData['SDMOD']['id'],
            ],
            [
                'username' => 'NENG SITI MARYAM, S.Pd.',
                'email' => 'neng.maryam@cimahi.bawaslu.go.id',
                'role' => 'Staf SDMOD',
                'divisi_id' => $divisiData['SDMOD']['id'],
            ],

            // Staf PP Datin
            [
                'username' => 'JAUHARI, S.Kom., M.M.',
                'email' => 'jauhari@cimahi.bawaslu.go.id',
                'role' => 'Staf PP Datin',
                'divisi_id' => $divisiData['PPDATIN']['id'],
            ],
            [
                'username' => 'SITI KHOFIFAH, S.H.',
                'email' => 'siti.khofifah@cimahi.bawaslu.go.id',
                'role' => 'Staf PP Datin',
                'divisi_id' => $divisiData['PPDATIN']['id'],
            ],
            [
                'username' => 'YOGAS PRASMANAJAYA, S.Sos.',
                'email' => 'yogas.prasmanajaya@cimahi.bawaslu.go.id',
                'role' => 'Staf PP Datin',
                'divisi_id' => $divisiData['PPDATIN']['id'],
            ],

            // Staf HPS
            [
                'username' => 'NUGRAHA WAHYU WARDHANA, S.H.',
                'email' => 'nugraha.wahyu@cimahi.bawaslu.go.id',
                'role' => 'Staf HPS',
                'divisi_id' => $divisiData['HPS']['id'],
            ],
            [
                'username' => 'MOCH. ADITYA UTAMA, S.H.',
                'email' => 'aditya.utama@cimahi.bawaslu.go.id',
                'role' => 'Staf HPS',
                'divisi_id' => $divisiData['HPS']['id'],
            ],

            // Staf P2H
            [
                'username' => 'MOCH. AKBAR PAJRI, S.H.',
                'email' => 'akbar.pajri@cimahi.bawaslu.go.id',
                'role' => 'Staf P2H',
                'divisi_id' => $divisiData['P2H']['id'],
            ],
            [
                'username' => 'PANJI ASY\'ARI, S.Sos.',
                'email' => 'panji.asyari@cimahi.bawaslu.go.id',
                'role' => 'Staf P2H',
                'divisi_id' => $divisiData['P2H']['id'],
            ],
            [
                'username' => 'DENI WAHYUDI PRASETYO, S.IP., M.H.',
                'email' => 'deni.wahyudi@cimahi.bawaslu.go.id',
                'role' => 'Staf P2H',
                'divisi_id' => $divisiData['P2H']['id'],
            ],
            [
                'username' => 'AJENG DIMAS',
                'email' => 'ajeng.dimas@cimahi.bawaslu.go.id',
                'role' => 'Staf P2H',
                'divisi_id' => $divisiData['P2H']['id'],
            ],

            // Staf Pendukung & Ad-Hoc
            [
                'username' => 'MUHAMMAD FIRMANSYAH, S.Pd.',
                'email' => 'firmansyah@cimahi.bawaslu.go.id',
                'role' => 'Staf Pendukung',
                'divisi_id' => $divisiData['PENDUKUNG']['id'],
            ],
            [
                'username' => 'DIAN NURUL FAZRI',
                'email' => 'dian.nurul@cimahi.bawaslu.go.id',
                'role' => 'Staf Pendukung',
                'divisi_id' => $divisiData['PENDUKUNG']['id'],
            ],
            [
                'username' => 'NIDA HAYATI',
                'email' => 'nida.hayati@cimahi.bawaslu.go.id',
                'role' => 'Staf Pendukung',
                'divisi_id' => $divisiData['PENDUKUNG']['id'],
            ],
            [
                'username' => 'PANWASCAM CIMAHI TENGAH',
                'email' => 'panwascam.tengah@cimahi.bawaslu.go.id',
                'role' => 'Panwascam',
                'divisi_id' => $divisiData['PENDUKUNG']['id'],
            ],
            [
                'username' => 'PANWASCAM CIMAHI SELATAN',
                'email' => 'panwascam.selatan@cimahi.bawaslu.go.id',
                'role' => 'Panwascam',
                'divisi_id' => $divisiData['PENDUKUNG']['id'],
            ],
            [
                'username' => 'PANWASCAM CIMAHI UTARA',
                'email' => 'panwascam.utara@cimahi.bawaslu.go.id',
                'role' => 'Panwascam',
                'divisi_id' => $divisiData['PENDUKUNG']['id'],
            ],
            [
                'username' => 'PKD CIMAHI',
                'email' => 'pkd.cimahi@cimahi.bawaslu.go.id',
                'role' => 'PKD',
                'divisi_id' => $divisiData['PENDUKUNG']['id'],
            ],
        ];

        foreach ($users as $u) {
            $existing = DB::table('users')->where('email', $u['email'])->first();
            if ($existing) {
                DB::table('users')->where('email', $u['email'])->update([
                    'username' => $u['username'],
                    'divisi_id' => $u['divisi_id'],
                    'password_hash' => $defaultPassword,
                    'role' => $u['role'],
                    'mfa_enabled' => true,
                    'status_aktif' => true,
                ]);
            } else {
                DB::table('users')->insert([
                    'user_id' => (string) Str::uuid(),
                    'username' => $u['username'],
                    'email' => $u['email'],
                    'divisi_id' => $u['divisi_id'],
                    'password_hash' => $defaultPassword,
                    'role' => $u['role'],
                    'mfa_enabled' => true,
                    'status_aktif' => true,
                    'created_at' => now(),
                ]);
            }
        }
    }
}
