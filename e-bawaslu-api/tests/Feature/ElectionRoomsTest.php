<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ElectionRoomsTest extends TestCase
{
    use RefreshDatabase;

    private function division(string $name): string
    {
        $id = (string) Str::uuid();
        DB::table('divisi')->insert(['divisi_id' => $id, 'nama_divisi' => $name]);
        return $id;
    }

    private function loginAs(string $role, ?string $division = null): void
    {
        $user = new User();
        $user->forceFill([
            'user_id' => (string) Str::uuid(), 'username' => 'pengawas',
            'email' => Str::uuid().'@example.test', 'password_hash' => 'test',
            'role' => $role, 'divisi_id' => $division,
        ])->save();
        $this->actingAs($user, 'sanctum');
    }

    public function test_only_chair_and_admin_can_create_stages_and_candidate_determination_requires_dispute_division(): void
    {
        $division = $this->division('SDM');
        $dispute = $this->division('Penyelesaian Sengketa');
        $this->loginAs('Staf SDM', $division);
        $this->postJson('/api/tahapan', ['divisi_id' => $division, 'nama_tahapan' => 'Verifikasi Administrasi'])->assertForbidden();
        foreach (['Ketua', 'Superadmin'] as $role) {
            $this->loginAs($role, $division);
            $this->postJson('/api/tahapan', ['divisi_id' => $division, 'nama_tahapan' => 'Penetapan Caleg'])->assertUnprocessable();
            $this->postJson('/api/tahapan', ['divisi_id' => $dispute, 'nama_tahapan' => 'Penetapan Caleg'])->assertCreated();
        }
    }

    public function test_non_p2h_division_can_upload_lhp_and_stage_must_match_supervising_division(): void
    {
        Storage::fake('public');
        $division = $this->division('SDM');
        $other = $this->division('Penyelesaian Sengketa');
        $this->loginAs('Ketua', $division);
        $stage = $this->postJson('/api/tahapan', ['divisi_id' => $division, 'nama_tahapan' => 'Verifikasi Administrasi'])->assertCreated()->json('data.id');
        $this->loginAs('Staf SDM', $division);
        $data = [
            'divisi_id' => $division, 'tahapan_id' => $stage, 'kategori' => 'LHP',
            'jenis_pemilihan' => 'Pilkada', 'no_surat' => '001/LHP',
            'tgl_surat' => '2026-09-07', 'perihal' => 'Verifikasi administrasi',
            'klasifikasi' => 'Rahasia',
            'file_dokumen' => UploadedFile::fake()->create('laporan.pdf', 10, 'application/pdf'),
        ];
        $this->postJson('/api/arsip', $data)->assertCreated()->assertJsonPath('data.jenis_pemilihan', 'Pilkada');
        $this->postJson('/api/arsip', array_replace($data, ['divisi_id' => $other]))->assertUnprocessable();
        $this->postJson('/api/arsip', array_replace($data, ['kategori' => 'LHPP', 'jenis_pemilihan' => 'Pemilu']))->assertCreated()->assertJsonPath('data.kategori', 'LHP');
        $this->loginAs('Panwascam (Tamu)', $division);
        $this->postJson('/api/arsip', $data)->assertForbidden();
    }

    public function test_c1_preserves_election_room_and_vote_details(): void
    {
        Storage::fake('public');
        $division = $this->division('SDM');
        $this->loginAs('Superadmin', $division);
        $tps = (string) Str::uuid();
        DB::table('wilayah_tps')->insert(['tps_id' => $tps, 'no_tps' => 1, 'kecamatan' => 'Cimahi Tengah', 'kelurahan' => 'Cimahi']);
        foreach (['Pemilu', 'Pilkada'] as $room) {
            $this->postJson('/api/c1', [
                'tps_id' => $tps, 'jenis_pemilihan' => $room,
                'sub_jenis_pemilihan' => $room === 'Pilkada' ? 'Wali Kota' : null,
                'total_suara_sah' => 10, 'total_suara_tidak_sah' => 1, 'total_pemilih' => 11,
                'suara_paslon' => '{"1":6,"2":4}',
                'file_c1' => UploadedFile::fake()->image($room.'.jpg', $room === 'Pemilu' ? 10 : 20, 10),
            ])->assertCreated()->assertJsonPath('data.jenis_pemilihan', $room)->assertJsonPath('data.suara_paslon.1', 6);
        }
        $this->getJson('/api/c1')->assertOk()->assertJsonCount(2, 'data');
        $this->assertDatabaseHas('berkas_c1', ['jenis_pemilihan' => 'Pilkada', 'sub_jenis_pemilihan' => 'Wali Kota']);
    }

    public function test_lhp_photo_and_three_observations_are_available_to_all_field_roles(): void
    {
        Storage::fake('public');
        $division = $this->division('P2H');
        $this->loginAs('Ketua', $division);
        $stage = $this->postJson('/api/tahapan', ['divisi_id' => $division, 'nama_tahapan' => 'Pemungutan Suara'])->assertCreated()->json('data.id');
        foreach (['PTPS', 'Panwascam', 'PKD'] as $role) {
            $this->loginAs($role);
            $data = [
                'divisi_id' => $division, 'tahapan_id' => $stage, 'kategori' => 'LHP',
                'jenis_pemilihan' => 'Pemilu', 'no_surat' => 'LHP/'.$role, 'tgl_surat' => '2026-09-07',
                'perihal' => 'Pengawasan TPS', 'klasifikasi' => 'Rahasia',
                'catatan_kejadian' => ['Kejadian pertama', 'Kejadian kedua', 'Kejadian ketiga'],
                'kondisi_kotak_surat' => 'Kotak utuh dan tersegel',
                'file_dokumen' => UploadedFile::fake()->image('foto.png'),
            ];
            $id = $this->postJson('/api/arsip', $data)->assertCreated()
                ->assertJsonPath('message', 'Foto berhasil diunggah dan laporan berhasil disimpan.')
                ->assertJsonPath('data.catatan_kejadian', $data['catatan_kejadian'])
                ->assertJsonPath('data.kondisi_kotak_surat', $data['kondisi_kotak_surat'])->json('data.id');
            $stored = \App\Models\Arsip::findOrFail($id);
            $this->assertSame($data['catatan_kejadian'], $stored->catatan_kejadian);
            $this->getJson('/api/arsip/'.$id.'/download')->assertOk()->assertHeader('content-type', 'image/png');
            $this->postJson('/api/arsip', array_replace($data, ['catatan_kejadian' => ['1', '2', '3', '4']]))
                ->assertUnprocessable()->assertJsonValidationErrors('catatan_kejadian');
            $this->postJson('/api/arsip', array_replace($data, ['file_dokumen' => UploadedFile::fake()->create('large.png', 5121, 'image/png')]))
                ->assertUnprocessable()->assertJsonValidationErrors('file_dokumen');
        }
        $this->getJson('/api/arsip')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_guest_can_view_letters_and_lhp_but_cannot_upload_revise_or_delete(): void
    {
        Storage::fake('public');
        $division = $this->division('P2H');
        $this->loginAs('Ketua', $division);
        $stage = $this->postJson('/api/tahapan', ['divisi_id' => $division, 'nama_tahapan' => 'Pemungutan Suara'])->json('data.id');
        foreach (['Surat Masuk', 'LHP'] as $category) {
            $this->loginAs('Ketua', $division);
            $data = ['divisi_id' => $division, 'tahapan_id' => $stage, 'jenis_pemilihan' => 'Pemilu',
                'kategori' => $category, 'no_surat' => '001', 'tgl_surat' => '2026-09-07',
                'perihal' => 'Dokumen pengawasan', 'klasifikasi' => 'Biasa',
                'file_dokumen' => UploadedFile::fake()->create('laporan.pdf', 10, 'application/pdf')];
            $id = $this->postJson('/api/arsip', $data)->assertCreated()->json('data.id');
            $this->loginAs('Panwascam (Tamu)');
            $this->getJson('/api/arsip')->assertOk();
            $this->getJson('/api/arsip/'.$id.'/download')->assertOk();
            $this->postJson('/api/arsip', $data)->assertForbidden();
            $this->postJson('/api/arsip/'.$id.'/revisi', ['file_dokumen' => $data['file_dokumen'], 'catatan_revisi' => 'Revisi'])->assertForbidden();
            $this->deleteJson('/api/arsip/'.$id, ['alasan_penghapusan' => 'Tidak diperlukan lagi'])->assertForbidden();
        }
        $this->postJson('/api/lhp', [])->assertForbidden();
    }

    public function test_stage_deletion_requires_leadership_and_preserves_reports(): void
    {
        Storage::fake('public');
        $division = $this->division('P2H');
        $this->loginAs('Ketua', $division);
        $stage = $this->postJson('/api/tahapan', ['divisi_id' => $division, 'nama_tahapan' => 'Tahapan Percobaan'])->json('data.id');
        $this->loginAs('PKD');
        $this->deleteJson('/api/tahapan/'.$stage)->assertForbidden();
        $this->loginAs('Superadmin');
        $this->deleteJson('/api/tahapan/'.$stage)->assertOk();
        $this->assertDatabaseMissing('tahapan', ['id' => $stage]);
        $stage = $this->postJson('/api/tahapan', ['divisi_id' => $division, 'nama_tahapan' => 'Pemungutan Suara'])->json('data.id');
        $id = $this->postJson('/api/arsip', [
            'divisi_id' => $division, 'tahapan_id' => $stage, 'jenis_pemilihan' => 'Pemilu',
            'kategori' => 'LHP', 'no_surat' => '001', 'tgl_surat' => '2026-09-07',
            'perihal' => 'LHP', 'klasifikasi' => 'Biasa',
            'file_dokumen' => UploadedFile::fake()->create('lhp.pdf', 10, 'application/pdf'),
        ])->assertCreated()->json('data.id');
        $this->deleteJson('/api/tahapan/'.$stage)->assertStatus(409);
        \App\Models\Arsip::findOrFail($id)->delete();
        $this->deleteJson('/api/tahapan/'.$stage)->assertStatus(409);
        $this->assertDatabaseHas('tahapan', ['id' => $stage]);
        $unused = $this->postJson('/api/tahapan', ['divisi_id' => $division, 'nama_tahapan' => 'Kosong'])->json('data.id');
        $this->loginAs('Ketua');
        $this->deleteJson('/api/tahapan/'.$unused)->assertOk();
    }
}
