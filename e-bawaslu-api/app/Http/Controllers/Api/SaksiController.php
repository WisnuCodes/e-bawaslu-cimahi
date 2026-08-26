<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SaksiController extends Controller
{
    public function index(Request $request)
    {
        if (!in_array($request->user()->role, ['Ketua Bawaslu', 'Admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $saksi = User::where('role', 'Saksi TPS')
                     ->leftJoin('wilayah_tps', 'users.tps_id', '=', 'wilayah_tps.tps_id')
                     ->select('users.user_id', 'users.username', 'users.email', 'users.whatsapp_number', 'users.tps_id', 'wilayah_tps.no_tps', 'wilayah_tps.kelurahan', 'wilayah_tps.kecamatan')
                     ->orderBy('users.created_at', 'desc')
                     ->get();

        return response()->json([
            'success' => true,
            'data' => $saksi
        ]);
    }

    public function store(Request $request)
    {
        if (!in_array($request->user()->role, ['Ketua Bawaslu', 'Admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'username' => 'required|string|max:50',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'whatsapp_number' => 'nullable|string',
            'tps_id' => 'required|uuid|exists:wilayah_tps,tps_id'
        ]);

        $user = User::create([
            'user_id' => (string) Str::uuid(),
            'tps_id' => $request->tps_id,
            'username' => $request->username,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'whatsapp_number' => $request->whatsapp_number,
            'role' => 'Saksi TPS',
            'mfa_enabled' => false,
            'status_aktif' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun Saksi berhasil dibuat',
            'data' => $user
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['Ketua Bawaslu', 'Admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $user = User::where('user_id', $id)->where('role', 'Saksi TPS')->firstOrFail();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun Saksi berhasil dihapus'
        ]);
    }
}
