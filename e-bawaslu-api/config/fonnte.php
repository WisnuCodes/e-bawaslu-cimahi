<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Fonnte WhatsApp API Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi untuk integrasi Fonnte WhatsApp Gateway API.
    | Dokumentasi: https://docs.fonnte.com
    |
    */

    'api_token' => env('FONNTE_API_TOKEN', ''),

    'base_url' => env('FONNTE_BASE_URL', 'https://api.fonnte.com'),

    // Default delay (dalam detik) sebelum pesan terkirim
    'default_delay' => env('FONNTE_DEFAULT_DELAY', '2'),

    // Tampilkan indikator "mengetik..." sebelum kirim pesan
    'typing' => env('FONNTE_TYPING', false),

    // Country code default (Indonesia)
    'country_code' => env('FONNTE_COUNTRY_CODE', '62'),

];
