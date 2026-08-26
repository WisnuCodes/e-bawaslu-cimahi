<?php

namespace App\Http\Controllers\Api\Whatsapp;

use App\Http\Controllers\Controller;
use App\Services\FonnteService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WhatsappController extends Controller
{
    protected FonnteService $fonnte;

    public function __construct(FonnteService $fonnte)
    {
        $this->fonnte = $fonnte;
    }

    /**
     * Kirim pesan teks via WhatsApp
     *
     * POST /api/whatsapp/send
     * Body: { "target": "08xxx", "message": "Halo..." }
     */
    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'target' => 'required|string',
            'message' => 'required|string|max:5000',
            'delay' => 'nullable|string',
            'schedule' => 'nullable|integer',
        ]);

        $options = $request->only(['delay', 'schedule', 'typing']);

        $result = $this->fonnte->sendMessage(
            $request->target,
            $request->message,
            array_filter($options)
        );

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success']
                ? 'Pesan berhasil dikirim via WhatsApp'
                : ($result['message'] ?? 'Gagal mengirim pesan'),
            'data' => $result['data'] ?? null,
        ], $result['success'] ? 200 : 422);
    }

    /**
     * Kirim pesan dengan media (gambar/file/video)
     *
     * POST /api/whatsapp/send-media
     * Body: { "target": "08xxx", "url": "https://...", "message": "Caption", "filename": "doc.pdf" }
     */
    public function sendMedia(Request $request): JsonResponse
    {
        $request->validate([
            'target' => 'required|string',
            'url' => 'required|url',
            'message' => 'nullable|string|max:5000',
            'filename' => 'nullable|string|max:255',
        ]);

        $result = $this->fonnte->sendMedia(
            $request->target,
            $request->url,
            $request->message ?? '',
            $request->filename
        );

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success']
                ? 'Media berhasil dikirim via WhatsApp'
                : ($result['message'] ?? 'Gagal mengirim media'),
            'data' => $result['data'] ?? null,
        ], $result['success'] ? 200 : 422);
    }

    /**
     * Kirim pesan ke banyak nomor (bulk)
     *
     * POST /api/whatsapp/send-bulk
     * Body: { "targets": ["08xxx", "08yyy"], "message": "Pengumuman..." }
     */
    public function sendBulk(Request $request): JsonResponse
    {
        $request->validate([
            'targets' => 'required|array|min:1|max:100',
            'targets.*' => 'required|string',
            'message' => 'required|string|max:5000',
        ]);

        $result = $this->fonnte->sendBulk(
            $request->targets,
            $request->message
        );

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success']
                ? 'Pesan bulk berhasil dikirim ke ' . count($request->targets) . ' nomor'
                : ($result['message'] ?? 'Gagal mengirim pesan bulk'),
            'data' => $result['data'] ?? null,
        ], $result['success'] ? 200 : 422);
    }

    /**
     * Kirim notifikasi via WhatsApp
     *
     * POST /api/whatsapp/notify
     * Body: { "target": "08xxx", "title": "Reminder", "body": "Jangan lupa..." }
     */
    public function notify(Request $request): JsonResponse
    {
        $request->validate([
            'target' => 'required|string',
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
        ]);

        $result = $this->fonnte->sendNotification(
            $request->target,
            $request->title,
            $request->body
        );

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success']
                ? 'Notifikasi berhasil dikirim'
                : ($result['message'] ?? 'Gagal mengirim notifikasi'),
            'data' => $result['data'] ?? null,
        ], $result['success'] ? 200 : 422);
    }

    /**
     * Cek status device WhatsApp yang terhubung di Fonnte
     *
     * GET /api/whatsapp/device-status
     */
    public function deviceStatus(): JsonResponse
    {
        $result = $this->fonnte->getDeviceStatus();

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success']
                ? 'Status device berhasil diambil'
                : ($result['message'] ?? 'Gagal mengambil status device'),
            'data' => $result['data'] ?? null,
        ]);
    }

    /**
     * Cek apakah Fonnte API sudah dikonfigurasi
     *
     * GET /api/whatsapp/status
     */
    public function status(): JsonResponse
    {
        $isConfigured = $this->fonnte->isConfigured();

        return response()->json([
            'success' => true,
            'message' => $isConfigured
                ? 'Fonnte WhatsApp API sudah dikonfigurasi'
                : 'Fonnte API token belum diset. Silakan set FONNTE_API_TOKEN di .env',
            'data' => [
                'configured' => $isConfigured,
                'provider' => 'Fonnte',
                'base_url' => config('fonnte.base_url'),
            ],
        ]);
    }
}
