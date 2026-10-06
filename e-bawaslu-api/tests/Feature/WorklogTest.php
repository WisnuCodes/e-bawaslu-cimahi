<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class WorklogTest extends TestCase
{
    use DatabaseMigrations;

    protected function migrateFreshUsing()
    {
        return ['--path' => [
            'database/migrations/2026_08_24_200001_create_divisi_table.php',
            'database/migrations/2026_08_24_200002_create_users_table.php',
            'database/migrations/2026_08_24_200006_create_daily_worklog_table.php',
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

    public function test_all_roles_can_create_their_own_worklog(): void
    {
        Storage::fake('public');
        foreach (['Superadmin', 'Admin', 'Ketua Bawaslu', 'Pimpinan', 'Koordinator Sekretariat',
            'Kepala Divisi', 'Kordiv', 'Kasubag', 'Kabag', 'Staf', 'Panwascam', 'PKD', 'PTPS', 'Saksi TPS',
            'Panwascam (Tamu)', 'Ketua', 'Pegawai'] as $role) {
            $user = $this->user($role);
            $this->postJson('/api/wfh/worklogs', ['tgl_kerja' => now()->toDateString(),
                'rincian_aktivitas' => 'Menyusun laporan pengawasan.', 'user_id' => 'not-the-owner',
            ])->assertCreated()->assertJsonPath('data.user_id', $user->user_id)
                ->assertJsonPath('data.status_approval', 'Pending Approval');
            $rows = $this->getJson('/api/wfh/worklogs?start_date='.now()->toDateString().'&end_date='.now()->toDateString())
                ->assertOk()->json('data');
            $this->assertContains($user->user_id, array_column($rows, 'user_id'));
        }
        $this->assertDatabaseCount('daily_worklog', 17);
    }

    public function test_attachment_upload_and_edit_preserve_work_date(): void
    {
        Storage::fake('public');
        $this->user('Ketua Bawaslu');
        $data = $this->postJson('/api/wfh/worklogs', ['tgl_kerja' => '2026-10-01',
            'rincian_aktivitas' => 'Menyusun laporan.',
            'file_lampiran' => UploadedFile::fake()->create('laporan.pdf', 20, 'application/pdf'),
        ])->assertCreated()->json('data');
        Storage::disk('public')->assertExists($data['attachment_url']);
        $this->postJson('/api/wfh/worklogs/'.$data['worklog_id'], ['rincian_aktivitas' => 'Laporan diperbarui.'])
            ->assertOk()->assertJsonPath('data.tgl_kerja', '2026-10-01')
            ->assertJsonPath('data.attachment_url', $data['attachment_url']);
    }

    public function test_invalid_activity_and_attachment_are_rejected(): void
    {
        Storage::fake('public');
        $this->user('Staf');
        $this->postJson('/api/wfh/worklogs', ['tgl_kerja' => now()->toDateString(),
            'rincian_aktivitas' => '   ',
            'file_lampiran' => UploadedFile::fake()->create('large.pdf', 2049, 'application/pdf'),
        ])->assertUnprocessable()->assertJsonValidationErrors(['rincian_aktivitas', 'file_lampiran']);
        $this->assertDatabaseCount('daily_worklog', 0);
    }

    public function test_guest_cannot_create_worklog(): void
    {
        $this->postJson('/api/wfh/worklogs', [])->assertUnauthorized();
    }
}
