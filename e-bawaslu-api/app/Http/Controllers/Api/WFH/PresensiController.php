<?php

namespace App\Http\Controllers\Api\WFH;

use App\Http\Controllers\Controller;
use App\Models\Presensi;
use App\Http\Requests\WFH\CheckInRequest;
use App\Http\Requests\WFH\CheckOutRequest;
use App\Http\Resources\WFH\PresensiResource;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PresensiController extends Controller
{
    /**
     * Check-in API for WFH
     */
    public function checkIn(CheckInRequest $request)
    {
        $userId = $request->user()->user_id;

        // Cek apakah sudah check-in hari ini
        $today = Carbon::today();
        $existing = Presensi::where('user_id', $userId)
            ->whereDate('timestamp_checkin', $today)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah melakukan check-in hari ini.'], 400);
        }

        $path = $request->file('selfie')->store('selfies', 'public');

        $presensi = Presensi::create([
            'presensi_id' => (string) Str::uuid(),
            'user_id' => $userId,
            'timestamp_checkin' => Carbon::now(),
            'selfie_masuk_url' => $path,
            'status_kehadiran' => 'Hadir',
        ]);

        return response()->json([
            'message' => 'Check-in berhasil.',
            'data' => new PresensiResource($presensi)
        ], 201);
    }

    /**
     * Check-out API for WFH
     */
    public function checkOut(CheckOutRequest $request)
    {
        $userId = $request->user()->user_id;

        $today = Carbon::today();
        $presensi = Presensi::where('user_id', $userId)
            ->whereDate('timestamp_checkin', $today)
            ->first();

        if (!$presensi) {
            return response()->json(['message' => 'Anda belum melakukan check-in hari ini.'], 400);
        }

        if ($presensi->timestamp_checkout) {
            return response()->json(['message' => 'Anda sudah melakukan check-out hari ini.'], 400);
        }

        $path = $request->file('selfie')->store('selfies', 'public');

        $presensi->update([
            'timestamp_checkout' => Carbon::now(),
            'selfie_keluar_url' => $path,
        ]);

        return response()->json([
            'message' => 'Check-out berhasil.',
            'data' => new PresensiResource($presensi)
        ], 200);
    }
}
