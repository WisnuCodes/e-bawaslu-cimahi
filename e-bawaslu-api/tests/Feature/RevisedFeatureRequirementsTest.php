<?php

namespace Tests\Feature;

use App\Models\Presensi;
use App\Models\User;
use Tests\TestCase;

class RevisedFeatureRequirementsTest extends TestCase
{
    public function test_role_hierarchy_supports_panwascam_pkd_and_ptps(): void
    {
        $panwascam = new User(['role' => 'Panwascam']);
        $pkd = new User(['role' => 'PKD']);
        $ptps = new User(['role' => 'PTPS']);

        $this->assertTrue($panwascam->isPanwascam());
        $this->assertTrue($pkd->isPkd());
        $this->assertTrue($ptps->isPtps());

        $this->assertTrue($panwascam->canAccessDocument('C1'));
        $this->assertTrue($pkd->canAccessDocument('LHP'));
        $this->assertTrue($ptps->canAccessDocument('C1'));
    }

    public function test_admin_controls_user_management_access(): void
    {
        $admin = new User(['role' => 'Super Administrator']);
        $staf = new User(['role' => 'Staf SDMOD']);

        $this->assertTrue($admin->canManageUsers());
        $this->assertFalse($staf->canManageUsers());
    }

    public function test_presensi_geofence_validates_max_radius(): void
    {
        $this->assertTrue(Presensi::isWithinGeofence(-6.906, 107.533, -6.900, 107.533, 1000));
        $this->assertFalse(Presensi::isWithinGeofence(-6.906, 107.533, -6.890, 107.533, 1000));
    }

    public function test_presensi_geofence_validates_100m_bawaslu_radius(): void
    {
        $bawasluLat = -6.871635;
        $bawasluLon = 107.544479;

        // Titik berjarak ~35 meter: di dalam radius 100m
        $this->assertTrue(Presensi::isWithinGeofence($bawasluLat, $bawasluLon, -6.871635, 107.544800, 100));

        // Titik berjarak ~4.2 km: di luar radius 100m
        $this->assertFalse(Presensi::isWithinGeofence($bawasluLat, $bawasluLon, -6.853854, 107.510951, 100));

        // Titik berjarak ~200 meter: di luar radius 100m
        $this->assertFalse(Presensi::isWithinGeofence($bawasluLat, $bawasluLon, -6.873500, 107.544479, 100));
    }
}
