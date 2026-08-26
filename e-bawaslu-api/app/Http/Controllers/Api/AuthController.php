<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use App\Services\FonnteService;

class AuthController extends Controller
{
    /**
     * MOCK: Redirect to Keycloak SSO
     */
    public function login(Request $request)
    {
        // Dalam skenario nyata, ini akan me-redirect ke Keycloak login page
        // return redirect()->away('https://keycloak.bawaslu.go.id/auth/...');
        
        // Untuk simulasi, kita langsung menerima kredensial dasar dan mengembalikan OTP requirement
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Kredensial tidak valid'
            ], 401);
        }

        // Generate Real OTP
        $otpCode = (string) rand(100000, 999999);
        $user->otp_code = $otpCode;
        $user->otp_expires_at = Carbon::now()->addMinutes(5);
        $user->save();
        
        Log::info("OTP untuk user {$user->email} adalah: {$otpCode}");

        // Send OTP via Fonnte WhatsApp Service
        if ($user->whatsapp_number) {
            $fonnte = app(FonnteService::class);
            if ($fonnte->isConfigured()) {
                $fonnte->sendOtp($user->whatsapp_number, $otpCode, 5);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Autentikasi tahap 1 berhasil. Silakan masukkan 6-digit OTP (MFA) yang dikirimkan ke perangkat Anda.',
            'data' => [
                'user_id' => $user->user_id,
                'require_mfa' => true
            ]
        ], 200);
    }

    /**
     * MOCK: Verify OTP and Generate JWT (Sanctum Token)
     */
    public function verifyMfa(Request $request)
    {
        $request->validate([
            'user_id' => 'required|uuid',
            'otp' => 'required|digits:6',
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Validasi OTP
        if (!$user->otp_code || $request->otp !== $user->otp_code) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak valid'
            ], 401);
        }

        if (Carbon::now()->isAfter($user->otp_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP sudah kadaluarsa (expired)'
            ], 401);
        }

        // Hapus OTP setelah berhasil
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();
        
        // Menerbitkan token Sanctum (mensimulasikan JWT behavior)
        $token = $user->createToken('bawaslu-enterprise-token', ['*'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'MFA Terverifikasi. Login berhasil.',
            'data' => [
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer'
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Sesi Keycloak & Token lokal berhasil dicabut (Logged out)'
        ], 200);
    }
}
