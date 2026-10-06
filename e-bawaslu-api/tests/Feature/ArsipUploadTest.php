<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ArsipUploadTest extends TestCase
{
    use DatabaseMigrations;

    protected function migrateFreshUsing()
    {
        return ['--path' => [
            'database/migrations/2026_08_24_200001_create_divisi_table.php',
            'database/migrations/2026_08_24_200002_create_users_table.php',
            'database/migrations/2026_08_24_200005_create_presensi_wfh_table.php',
            'database/migrations/2026_08_24_200007_create_arsip_dokumen_table.php',
            'database/migrations/2026_08_26_074350_add_advanced_fields_to_tables.php',
            'database/migrations/2026_08_31_210237_create_tahapan_table.php',
            'database/migrations/2026_09_07_000001_add_lhp_metadata_to_arsip.php',
            'database/migrations/2026_09_07_000002_add_jenjang_pengawas_to_arsip.php',
            'database/migrations/2026_09_07_000003_add_observation_details_to_arsip.php',
            'database/migrations/2026_08_24_200009_create_audit_log_trail_table.php',
        ]];
    }

    private function user(string $role): User
    {
        $user = new User;
        $user->forceFill(['user_id' => (string) Str::uuid(), 'username' => (string) Str::uuid(),
            'email' => Str::uuid().'@example.test', 'password_hash' => 'test', 'role' => $role])->save();
        $this->actingAs($user, 'api');
        return $user;
    }

    public function test_kordiv_can_upload_and_list_a_document(): void
    {
        Storage::fake('public');
        $division = (string) Str::uuid();
        \Illuminate\Support\Facades\DB::table('divisi')->insert(['divisi_id' => $division, 'nama_divisi' => 'P2H']);
        $user = $this->user('Kordiv P2H');
        $user->forceFill(['divisi_id' => $division])->save();
        $data = $this->postJson('/api/arsip', [
            'divisi_id' => $division, 'no_surat' => '001/P2H/2026', 'tgl_surat' => '2026-10-06',
            'perihal' => 'Dokumen pengawasan', 'kategori' => 'Surat Masuk', 'klasifikasi' => 'Biasa',
            'file_dokumen' => UploadedFile::fake()->create('dokumen.pdf', 10, 'application/pdf'),
        ])->assertCreated()->json('data');
        Storage::disk('public')->assertExists($data['file_path']);
        $this->getJson('/api/arsip')->assertOk()->assertJsonPath('data.0.no_surat', '001/P2H/2026');
    }
}
