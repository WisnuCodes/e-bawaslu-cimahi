<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    protected string $token;
    protected string $baseUrl;
    protected string $defaultDelay;
    protected bool $typing;
    protected string $countryCode;

    public function __construct()
    {
        $this->token = config('fonnte.api_token', '');
        $this->baseUrl = config('fonnte.base_url', 'https://api.fonnte.com');
        $this->defaultDelay = config('fonnte.default_delay', '2');
        $this->typing = config('fonnte.typing', false);
        $this->countryCode = config('fonnte.country_code', '62');
    }

    /**
     * Kirim pesan teks via WhatsApp
     *
     * @param string $target Nomor tujuan (misal: 08123456789)
     * @param string $message Isi pesan
     * @param array $options Opsi tambahan (delay, typing, schedule, dll)
     * @return array
     */
    public function sendMessage(string $target, string $message, array $options = []): array
    {
        $payload = array_merge([
            'target' => $target,
            'message' => $message,
            'delay' => $options['delay'] ?? $this->defaultDelay,
            'typing' => $options['typing'] ?? $this->typing,
            'countryCode' => $this->countryCode,
        ], $options);

        return $this->post('/send', $payload);
    }

    /**
     * Kirim pesan dengan media (gambar, file, audio, video)
     *
     * @param string $target Nomor tujuan
     * @param string $mediaUrl URL media yang akan dikirim
     * @param string $message Caption/pesan (opsional)
     * @param string|null $filename Nama file custom (opsional)
     * @return array
     */
    public function sendMedia(string $target, string $mediaUrl, string $message = '', ?string $filename = null): array
    {
        $payload = [
            'target' => $target,
            'url' => $mediaUrl,
            'message' => $message,
            'delay' => $this->defaultDelay,
            'countryCode' => $this->countryCode,
        ];

        if ($filename) {
            $payload['filename'] = $filename;
        }

        return $this->post('/send', $payload);
    }

    /**
     * Kirim pesan ke banyak nomor sekaligus (bulk)
     *
     * @param array $targets Array nomor tujuan
     * @param string $message Isi pesan
     * @param array $options Opsi tambahan
     * @return array
     */
    public function sendBulk(array $targets, string $message, array $options = []): array
    {
        // Fonnte mendukung multi-target dengan koma sebagai pemisah
        $targetString = implode(',', $targets);

        $payload = array_merge([
            'target' => $targetString,
            'message' => $message,
            'delay' => $options['delay'] ?? $this->defaultDelay,
            'countryCode' => $this->countryCode,
        ], $options);

        return $this->post('/send', $payload);
    }

    /**
     * Cek status device/perangkat WhatsApp yang terhubung
     *
     * @return array
     */
    public function getDeviceStatus(): array
    {
        return $this->post('/device');
    }

    /**
     * Kirim OTP via WhatsApp
     *
     * @param string $target Nomor tujuan
     * @param string $otpCode Kode OTP
     * @param int $expiryMinutes Masa berlaku OTP (menit)
     * @return array
     */
    public function sendOtp(string $target, string $otpCode, int $expiryMinutes = 5): array
    {
        $message = "Bawaslu SSO - Kode OTP Anda adalah: *{$otpCode}*. "
            . "Kode ini berlaku selama {$expiryMinutes} menit. "
            . "Jangan berikan kode ini kepada siapapun.";

        return $this->sendMessage($target, $message);
    }

    /**
     * Kirim notifikasi/reminder via WhatsApp
     *
     * @param string $target Nomor tujuan
     * @param string $title Judul notifikasi
     * @param string $body Isi notifikasi
     * @return array
     */
    public function sendNotification(string $target, string $title, string $body): array
    {
        $message = "📢 *{$title}*\n\n{$body}\n\n_Dikirim otomatis oleh Sistem e-Bawaslu_";

        return $this->sendMessage($target, $message);
    }

    /**
     * Cek apakah service Fonnte sudah dikonfigurasi dengan benar
     *
     * @return bool
     */
    public function isConfigured(): bool
    {
        return !empty($this->token);
    }

    /**
     * HTTP POST request ke Fonnte API
     *
     * @param string $endpoint
     * @param array $payload
     * @return array
     */
    protected function post(string $endpoint, array $payload = []): array
    {
        if (!$this->isConfigured()) {
            Log::warning('Fonnte API token belum dikonfigurasi.');
            return [
                'success' => false,
                'message' => 'Fonnte API token belum dikonfigurasi. Set FONNTE_API_TOKEN di file .env',
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post($this->baseUrl . $endpoint, $payload);

            $result = $response->json();

            Log::info("Fonnte API [{$endpoint}]", [
                'status' => $response->status(),
                'response' => $result,
            ]);

            return [
                'success' => $response->successful(),
                'status_code' => $response->status(),
                'data' => $result,
            ];
        } catch (\Exception $e) {
            Log::error("Fonnte API Error [{$endpoint}]: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Gagal menghubungi Fonnte API: ' . $e->getMessage(),
            ];
        }
    }
}
