<?php

namespace Tests\Feature;

use App\Models\Presensi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class IzinTest extends TestCase
{
    use DatabaseMigrations;

    // Exercise the real WFH schema without unrelated archive migrations.
    protected function migrateFreshUsing()
    {
        return ['--path' => [
            'database/migrations/2026_08_24_200001_create_divisi_table.php',
            'database/migrations/2026_08_24_200002_create_users_table.php',
            'database/migrations/2026_08_24_200005_create_presensi_wfh_table.php',
            'database/migrations/2026_08_24_200007_create_arsip_dokumen_table.php',
            'database/migrations/2026_08_24_200009_create_audit_log_trail_table.php',
            'database/migrations/2026_08_26_074350_add_advanced_fields_to_tables.php',
            'database/migrations/2026_08_27_120048_split_status_kehadiran_in_presensi_wfh_table.php',
            'database/migrations/2026_09_14_142441_add_keterangan_izin_to_presensi_wfh_table.php',
            'database/migrations/2026_10_06_000001_add_lampiran_izin_to_presensi_wfh.php',
        ]];
    }

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-10-06 09:00:00', 'Asia/Jakarta'));
        Storage::fake('public');
        Http::fake(['*' => Http::response([])]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function employee(string $role = 'Staf'): User
    {
        $user = new User;
        $user->forceFill([
            'user_id' => (string) Str::uuid(), 'username' => (string) Str::uuid(),
            'email' => Str::uuid().'@example.test', 'password_hash' => 'test', 'role' => $role,
        ])->save();
        $this->actingAs($user, 'api');
        return $user;
    }

    private function payload(string $type = 'Sakit'): array
    {
        return ['jenis_izin' => $type, 'keterangan_izin' => 'Tidak dapat bekerja hari ini.',
            'file_lampiran' => UploadedFile::fake()->create('surat.pdf', 20, 'application/pdf')];
    }

    public function test_staff_and_chair_can_submit_absence_with_a_document(): void
    {
        foreach (['Staf' => 'Sakit', 'Ketua Bawaslu' => 'Izin'] as $role => $type) {
            $user = $this->employee($role);
            $data = $this->postJson('/api/wfh/izin', $this->payload($type))->assertCreated()
                ->assertJsonPath('data.status_ci', $type)->assertJsonPath('data.user_id', $user->user_id)->json('data');
            Storage::disk('public')->assertExists($data['lampiran_izin']);
            $this->assertDatabaseHas('presensi_wfh', ['presensi_id' => $data['presensi_id'],
                'timestamp_checkout' => null, 'selfie_masuk_url' => null, 'gps_koordinat' => null]);
            $this->getJson('/api/wfh/presensi?start_date=2026-10-06&end_date=2026-10-06')
                ->assertOk()->assertJsonPath('today.status_ci', $type);
        }
    }

    public function test_duplicate_submission_does_not_store_another_document(): void
    {
        $this->employee();
        $this->postJson('/api/wfh/izin', $this->payload())->assertCreated();
        $this->postJson('/api/wfh/izin', $this->payload('Izin'))->assertUnprocessable()->assertJsonValidationErrors('jenis_izin');
        $this->assertDatabaseCount('presensi_wfh', 1);
        $this->assertCount(1, Storage::disk('public')->allFiles('izin'));
    }

    public function test_existing_attendance_prevents_absence_submission(): void
    {
        $user = $this->employee();
        Presensi::create(['presensi_id' => (string) Str::uuid(), 'user_id' => $user->user_id,
            'timestamp_checkin' => Carbon::now(), 'status_ci' => 'Hadir']);
        $this->postJson('/api/wfh/izin', $this->payload())->assertUnprocessable();
        $this->assertCount(0, Storage::disk('public')->allFiles('izin'));
    }

    public function test_validation_rejects_missing_invalid_and_oversized_documents(): void
    {
        $this->employee();
        $this->postJson('/api/wfh/izin', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['jenis_izin', 'keterangan_izin', 'file_lampiran']);
        $this->postJson('/api/wfh/izin', array_merge($this->payload(), [
            'jenis_izin' => 'Other', 'keterangan_izin' => '   ',
            'file_lampiran' => UploadedFile::fake()->create('script.txt', 1, 'text/plain'),
        ]))->assertUnprocessable()->assertJsonValidationErrors(['jenis_izin', 'keterangan_izin', 'file_lampiran']);
        $this->postJson('/api/wfh/izin', array_merge($this->payload(), [
            'file_lampiran' => UploadedFile::fake()->create('large.pdf', 2049, 'application/pdf'),
        ]))->assertUnprocessable()->assertJsonValidationErrors('file_lampiran');
        $this->assertDatabaseCount('presensi_wfh', 0);
    }

    public function test_today_status_is_independent_of_history_filter_and_other_users(): void
    {
        $owner = $this->employee();
        $this->postJson('/api/wfh/izin', $this->payload())->assertCreated();
        $this->getJson('/api/wfh/presensi?start_date=2026-10-01&end_date=2026-10-01')
            ->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('today.status_ci', 'Sakit');
        $this->employee();
        $this->getJson('/api/wfh/presensi')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('today', null);
    }

    public function test_absence_cannot_be_checked_in_or_out(): void
    {
        $this->employee();
        $id = $this->postJson('/api/wfh/izin', $this->payload())->assertCreated()->json('data.presensi_id');
        $photo = ['selfie_image' => UploadedFile::fake()->image('selfie.jpg'),
            'gps_koordinat' => '-6.8716,107.5445', 'liveness_score' => 0.95, 'presensi_id' => $id];
        $this->postJson('/api/wfh/presensi/check-in', $photo)->assertUnprocessable();
        $this->postJson('/api/wfh/presensi/check-out', $photo)->assertUnprocessable();
        $this->assertDatabaseCount('presensi_wfh', 1);
        $this->assertDatabaseHas('presensi_wfh', ['presensi_id' => $id, 'status_ci' => 'Sakit', 'timestamp_checkout' => null]);
    }

    public function test_guest_cannot_submit_absence(): void
    {
        $this->postJson('/api/wfh/izin', $this->payload())->assertUnauthorized();
    }
}
