<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WFH\PresensiController;
use App\Http\Controllers\Api\WFH\WorklogController;
use App\Http\Controllers\Api\WFH\TukinController;
use App\Http\Controllers\Api\Arsip\ArsipController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\C1\C1Controller;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaksiController;
use App\Http\Controllers\Api\Whatsapp\WhatsappController;

// Auth Routes (MOCK SSO Keycloak)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-mfa', [AuthController::class, 'verifyMfa']);

// Protected API Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Master Data Routes
    Route::prefix('master')->group(function () {
        Route::get('/divisi', [MasterDataController::class, 'getDivisi']);
        Route::get('/tps', [MasterDataController::class, 'getTps']);
    });

    // WFH Module Routes
    Route::prefix('wfh')->group(function () {
        Route::get('/presensi', [PresensiController::class, 'index']);
        Route::put('/presensi/{id}', [PresensiController::class, 'update']);
        Route::delete('/presensi/{id}', [PresensiController::class, 'destroy']);
        Route::post('/checkin', [PresensiController::class, 'checkIn']);
        Route::post('/checkout', [PresensiController::class, 'checkOut']);
        
        // Worklog Routes
        Route::get('/worklogs', [WorklogController::class, 'index']);
        Route::post('/worklogs', [WorklogController::class, 'store']);
        Route::post('/worklogs/{id}/approve', [WorklogController::class, 'approve']);
        Route::post('/worklogs/{id}', [WorklogController::class, 'update']);
        Route::delete('/worklogs/{id}', [WorklogController::class, 'destroy']);

        // Tukin Routes
        Route::get('/tukin', [TukinController::class, 'index']);
        Route::post('/tukin/calculate', [TukinController::class, 'calculate']);
    });

    // Arsip Module Routes
    Route::prefix('arsip')->group(function () {
        Route::get('/', [ArsipController::class, 'index']);
        Route::get('/search', [ArsipController::class, 'search']); // Mock Elasticsearch
        Route::get('/logs', [ArsipController::class, 'logs']); // Audit Logs for Arsip
        Route::post('/', [ArsipController::class, 'store']);
        Route::post('/{id}/revisi', [ArsipController::class, 'uploadRevisi']);
        Route::get('/{id}/versions', [ArsipController::class, 'getVersions']);
        Route::get('/{id}/download', [ArsipController::class, 'download']); // Download w/ Watermark
        Route::delete('/{id}', [ArsipController::class, 'destroy']); // Soft Delete w/ Reason
    });

    // C1 (P2H) Module Routes
    Route::prefix('c1')->group(function () {
        Route::get('/', [C1Controller::class, 'index']);
        Route::post('/scan', [C1Controller::class, 'scanOcr']); // High-level OCR scan
        Route::post('/', [C1Controller::class, 'store']); // Enkripsi AES-256
        Route::put('/{id}', [C1Controller::class, 'update']);
        Route::post('/{id}/approve', [C1Controller::class, 'approve']);
        Route::delete('/{id}', [C1Controller::class, 'destroy']);
    });

    // Report (Eksport BPK)
    Route::get('/reports/export', [ReportController::class, 'exportPdf']);


    // Saksi TPS Module Routes
    Route::prefix('saksi')->group(function () {
        Route::get('/', [SaksiController::class, 'index']);
        Route::post('/', [SaksiController::class, 'store']);
        Route::delete('/{id}', [SaksiController::class, 'destroy']);
    });

    // WhatsApp (Fonnte) Module Routes
    Route::prefix('whatsapp')->group(function () {
        Route::get('/status', [WhatsappController::class, 'status']);
        Route::get('/device-status', [WhatsappController::class, 'deviceStatus']);
        Route::post('/send', [WhatsappController::class, 'send']);
        Route::post('/send-media', [WhatsappController::class, 'sendMedia']);
        Route::post('/send-bulk', [WhatsappController::class, 'sendBulk']);
        Route::post('/notify', [WhatsappController::class, 'notify']);
    });
    // Audit Trail Route
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});
