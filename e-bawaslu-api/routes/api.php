<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WFH\PresensiController;

use App\Http\Controllers\Api\WFH\WorklogController;
use App\Http\Controllers\Api\Arsip\ArsipController;
use App\Http\Controllers\Api\AuthController;

// Auth Routes (Public)
Route::post('/login', [AuthController::class, 'login']);

// Protected API Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // WFH Module Routes
    Route::prefix('wfh')->group(function () {
        Route::post('/checkin', [PresensiController::class, 'checkIn']);
        Route::post('/checkout', [PresensiController::class, 'checkOut']);
        
        // Worklog Routes
        Route::get('/worklogs', [WorklogController::class, 'index']);
        Route::post('/worklogs', [WorklogController::class, 'store']);
        Route::post('/worklogs/{id}', [WorklogController::class, 'update']);
    });

    // Arsip Module Routes
    Route::prefix('arsip')->group(function () {
        Route::get('/', [ArsipController::class, 'index']);
        Route::post('/', [ArsipController::class, 'store']);
    });

    // C1 (P2H) Module Routes
    Route::prefix('c1')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\C1\C1Controller::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\C1\C1Controller::class, 'store']);
        Route::post('/{id}/approve', [\App\Http\Controllers\Api\C1\C1Controller::class, 'approve']);
    });

    // Audit Trail Route
    Route::get('/audit-logs', [\App\Http\Controllers\Api\AuditLogController::class, 'index']);
});
