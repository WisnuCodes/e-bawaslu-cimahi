<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\C1;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Tests\TestCase;

class FieldSupervisorTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, ?string $division = null): User
    {
        $user = new User;
        $user->forceFill(['user_id' => (string) Str::uuid(), 'username' => (string) Str::uuid(),
            'email' => Str::uuid().'@example.test', 'password_hash' => 'test', 'role' => $role,
            'divisi_id' => $division, 'koordinat_acuan' => '-6.87,107.54'])->save();
        $this->actingAs($user, 'sanctum');
        return $user;
    }

    private function division(): string
    {
        $id = (string) Str::uuid();
        DB::table('divisi')->insert(['divisi_id' => $id, 'nama_divisi' => 'P2H']);
        return $id;
    }

    private function c1(User $user): C1
    {
        $tps = (string) Str::uuid();
        DB::table('wilayah_tps')->insert(['tps_id' => $tps, 'no_tps' => 1, 'kecamatan' => 'Cimahi Tengah', 'kelurahan' => 'Cimahi']);
        Storage::disk('public')->put('c1-test.dat', Crypt::encrypt('%PDF-1.4 test document'));
        return C1::create(['c1_id' => (string) Str::uuid(), 'tps_id' => $tps, 'uploaded_by' => $user->user_id,
            'status_c1' => 'Draft', 'file_url' => 'c1-test.dat', 'jenis_pemilihan' => 'Pemilu']);
    }

    public function test_supervisors_upload_mhp_and_download_archive_and_c1(): void
    {
        Storage::fake('public');
        $division = $this->division();
        foreach (['Panwascam', 'PKD', 'PTPS'] as $role) {
            $user = $this->user($role);
            $c1 = $this->c1($user);
            $this->getJson('/api/c1/'.$c1->c1_id.'/download')->assertOk()->assertContent('%PDF-1.4 test document');
            $archive = $this->postJson('/api/arsip', [
                'divisi_id' => $division, 'no_surat' => 'MHP/'.$role, 'tgl_surat' => '2026-09-07',
                'perihal' => 'Hasil pengawasan', 'kategori' => 'MHP', 'jenjang_pengawas' => $role,
                'klasifikasi' => 'Biasa', 'file_dokumen' => UploadedFile::fake()->create('mhp.pdf', 10, 'application/pdf'),
            ])->assertCreated()->assertJsonPath('data.jenjang_pengawas', $role)->json('data.id');
            $this->getJson('/api/arsip/'.$archive.'/download')->assertOk();
            $this->postJson('/api/c1/'.$c1->c1_id.'/approve', ['status' => 'Approved'])->assertForbidden();
            $this->postJson('/api/c1', [
                'tps_id' => $c1->tps_id, 'total_suara_sah' => 5, 'total_suara_tidak_sah' => 0,
                'total_pemilih' => 5, 'file_c1' => UploadedFile::fake()->image($role.'.png', strlen($role), 10),
            ])->assertCreated();
        }
        $this->getJson('/api/c1?kecamatan=Cimahi%20Tengah&kelurahan=Cimahi')->assertOk()->assertJsonCount(6, 'data');
        $this->getJson('/api/c1?kecamatan=Cimahi%20Utara')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_admin_assigns_division_and_only_its_head_can_approve(): void
    {
        Storage::fake('public');
        $division = $this->division();
        $admin = $this->user('Superadmin');
        $c1 = $this->c1($admin);
        $url = '/api/c1/'.$c1->c1_id;
        $this->putJson($url.'/approval-divisi', ['approval_divisi_id' => $division])->assertOk();
        $this->user('Staf', $division);
        $this->postJson($url.'/approve', ['status' => 'Approved'])->assertForbidden();
        $this->putJson($url.'/approval-divisi', ['approval_divisi_id' => $division])->assertForbidden();
        $this->user('Kepala Divisi', $this->division());
        $this->postJson($url.'/approve', ['status' => 'Approved'])->assertForbidden();
        $this->user('Kepala Divisi', $division);
        $this->postJson($url.'/approve', ['status' => 'Approved'])->assertOk();
        $this->putJson($url, [])->assertUnprocessable();
        $this->user('Panwascam (Tamu)');
        $this->postJson('/api/c1', [])->assertForbidden();
        $this->getJson($url.'/download')->assertOk();
    }

    public function test_radius_rejects_missing_malformed_and_distant_coordinates(): void
    {
        Storage::fake('public');
        $user = $this->user('PKD');
        $data = ['selfie_image' => UploadedFile::fake()->image('selfie.jpg'), 'liveness_score' => 0.9];
        $this->postJson('/api/wfh/checkin', $data + ['gps_koordinat' => '-6.89,107.54'])->assertForbidden();
        $this->postJson('/api/wfh/checkin', $data + ['gps_koordinat' => 'invalid'])->assertUnprocessable();
        $user->koordinat_acuan = null; $user->save();
        $this->postJson('/api/wfh/checkin', $data + ['gps_koordinat' => '-6.87,107.54'])->assertUnprocessable();
        $user->koordinat_acuan = '-6.87,107.54'; $user->save();
        $checkin = $this->postJson('/api/wfh/checkin', $data + ['gps_koordinat' => '-6.871,107.54'])->assertCreated()->json('data.presensi_id');
        $this->travelTo(now()->setTime(17, 0));
        $this->postJson('/api/wfh/checkout', $data + ['presensi_id' => $checkin, 'gps_koordinat' => '-6.89,107.54'])->assertForbidden();
        $this->postJson('/api/wfh/checkout', $data + ['presensi_id' => $checkin, 'gps_koordinat' => '-6.871,107.54'])->assertOk();
        $this->travelBack();
    }

    public function test_admin_can_save_home_coordinates_and_invalid_values_are_rejected(): void
    {
        $this->user('Superadmin');
        $data = ['username' => 'pkd-test', 'email' => 'pkd@example.test', 'role' => 'PKD',
            'koordinat_acuan' => '-6.87,107.54'];
        $this->postJson('/api/users', $data)->assertCreated();
        $this->postJson('/api/users', array_replace($data, ['koordinat_acuan' => '100,200', 'username' => 'pkd-test2', 'email' => 'pkd2@example.test']))->assertUnprocessable()->assertJsonValidationErrors('koordinat_acuan');
    }
}
