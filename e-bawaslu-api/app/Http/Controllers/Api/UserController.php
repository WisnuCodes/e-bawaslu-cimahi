<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private function isAdminOrKetua($user)
    {
        $role = strtolower($user->role);
        return str_contains($role, 'admin') || str_contains($role, 'superadmin') || str_contains($role, 'ketua');
    }

    public function index(Request $request)
    {
        if (!$this->isAdminOrKetua($request->user())) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Include divisi name if possible
        $users = User::leftJoin('divisi', 'users.divisi_id', '=', 'divisi.divisi_id')
            ->select('users.*', 'divisi.nama_divisi')
            ->orderBy('users.created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function show(Request $request, $id)
    {
        if (!$this->isAdminOrKetua($request->user())) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->isAdminOrKetua($request->user())) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'whatsapp_number' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'role' => 'required|string|max:50',
            'divisi_id' => 'nullable|uuid|exists:divisi,divisi_id',
            'tps_id' => 'nullable|uuid|exists:wilayah_tps,tps_id',
            'koordinat_acuan' => 'nullable|string',
            'ppid_url' => 'nullable|string',
            'status_aktif' => 'nullable|boolean'
        ]);

        $password = $request->password ? $request->password : 'Bawaslu123';

        $user = User::create([
            'user_id' => (string) Str::uuid(),
            'username' => $request->username,
            'email' => $request->email,
            'whatsapp_number' => $request->whatsapp_number,
            'password_hash' => Hash::make($password), // Gunakan Hash::make atau bcrypt
            'password' => Hash::make($password), // Untuk default auth laravel jika digunakan
            'role' => $request->role,
            'divisi_id' => $request->divisi_id,
            'tps_id' => $request->tps_id,
            'koordinat_acuan' => $request->koordinat_acuan,
            'ppid_url' => $request->ppid_url,
            'status_aktif' => $request->status_aktif ?? true,
            'mfa_enabled' => false
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil ditambahkan',
            'data' => $user
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->isAdminOrKetua($request->user())) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $request->validate([
            'username' => 'required|string|max:255|unique:users,username,'.$id.',user_id',
            'email' => 'required|email|max:255|unique:users,email,'.$id.',user_id',
            'whatsapp_number' => 'nullable|string|max:20',
            'role' => 'required|string|max:50',
            'divisi_id' => 'nullable|uuid|exists:divisi,divisi_id',
            'tps_id' => 'nullable|uuid|exists:wilayah_tps,tps_id',
            'koordinat_acuan' => 'nullable|string',
            'ppid_url' => 'nullable|string',
            'status_aktif' => 'nullable|boolean'
        ]);

        $updateData = [
            'username' => $request->username,
            'email' => $request->email,
            'whatsapp_number' => $request->whatsapp_number,
            'role' => $request->role,
            'divisi_id' => $request->divisi_id,
            'tps_id' => $request->tps_id,
            'koordinat_acuan' => $request->koordinat_acuan,
            'ppid_url' => $request->ppid_url,
        ];

        if ($request->has('status_aktif')) {
            $updateData['status_aktif'] = $request->status_aktif;
        }
        
        if ($request->password) {
            $updateData['password_hash'] = Hash::make($request->password);
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diupdate',
            'data' => $user
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->isAdminOrKetua($request->user())) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        
        // Prevent deleting yourself
        if ($request->user()->user_id === $user->user_id) {
            return response()->json(['success' => false, 'message' => 'Tidak dapat menghapus akun sendiri.'], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus'
        ]);
    }
}
