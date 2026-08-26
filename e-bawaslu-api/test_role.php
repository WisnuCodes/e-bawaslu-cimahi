<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('username', 'Fathir Rizka Latif, S.H.')->first();
$role = strtolower($user->role);
$isAdmin = str_contains($role, 'admin');
$isPimpinan = str_contains($role, 'ketua') || str_contains($role, 'pimpinan') || str_contains($role, 'koordinator sekretariat');
$isKadiv = str_contains($role, 'kordiv') || str_contains($role, 'kepala divisi') || str_contains($role, 'kasubag') || str_contains($role, 'kabag');

echo "Role: $role\n";
echo "isAdmin: " . ($isAdmin ? 'true' : 'false') . "\n";
echo "isPimpinan: " . ($isPimpinan ? 'true' : 'false') . "\n";
echo "isKadiv: " . ($isKadiv ? 'true' : 'false') . "\n";
