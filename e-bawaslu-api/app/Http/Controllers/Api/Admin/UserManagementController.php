<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->canManageUsers()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: hanya Admin / Super Admin yang dapat mengelola pengguna.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => User::orderBy('username')->get()
        ], 200);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->canManageUsers()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: hanya Admin / Super Admin yang dapat menambah pengguna.'
            ], 403);
        }

        $request->validate([
            'username' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|string|max:100',
            'divisi_id' => 'nullable|uuid|exists:divisi,divisi_id',
            'tps_id' => 'nullable|uuid|exists:wilayah_tps,tps_id',
            'password' => 'required|string|min:6',
        ]);

        $newUser = User::create([
            'user_id' => (string) Str::uuid(),
            'username' => $request->username,
            'email' => $request->email,
            'role' => $request->role,
            'divisi_id' => $request->divisi_id,
            'tps_id' => $request->tps_id,
            'password_hash' => Hash::make($request->password),
            'mfa_enabled' => false,
            'status_aktif' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna baru berhasil ditambahkan.',
            'data' => $newUser
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $user = $request->user();

        if (!$user || !$user->canManageUsers()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $target = User::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $target
        ], 200);
    }

    public function update(Request $request, string $id)
    {
        $user = $request->user();

        if (!$user || !$user->canManageUsers()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $target = User::findOrFail($id);

        $request->validate([
            'username' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:users,email,' . $target->user_id . ',user_id',
            'role' => 'sometimes|string|max:100',
            'divisi_id' => 'nullable|uuid|exists:divisi,divisi_id',
            'tps_id' => 'nullable|uuid|exists:wilayah_tps,tps_id',
            'password' => 'sometimes|string|min:6',
            'status_aktif' => 'sometimes|boolean',
        ]);

        $payload = [
            'username' => $request->username ?? $target->username,
            'email' => $request->email ?? $target->email,
            'role' => $request->role ?? $target->role,
            'divisi_id' => $request->divisi_id ?? $target->divisi_id,
            'tps_id' => $request->tps_id ?? $target->tps_id,
            'status_aktif' => $request->status_aktif ?? $target->status_aktif,
        ];

        if ($request->filled('password')) {
            $payload['password_hash'] = Hash::make($request->password);
        }

        $target->update($payload);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => $target->fresh()
        ], 200);
    }

    public function destroy(Request $request, string $id)
    {
        $user = $request->user();

        if (!$user || !$user->canManageUsers()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $target = User::findOrFail($id);
        $target->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus.'
        ], 200);
    }
}
