<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Http\Resources\AuditLogResource;

class AuditLogController extends Controller
{
    /**
     * Get paginated audit logs (Admin only in real scenario)
     */
    public function index(Request $request)
    {
        // For production: Add middleware to restrict this to Super Admin
        $logs = AuditLog::orderBy('timestamp', 'desc')->paginate(50);
        return AuditLogResource::collection($logs);
    }
}
