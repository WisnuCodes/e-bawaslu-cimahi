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
        $query = AuditLog::with('user');

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(action) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(target_entity) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(reason) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->whereRaw('LOWER(username) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('timestamp', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('timestamp', '<=', $request->end_date);
        }

        $logs = $query->orderBy('timestamp', 'desc')->paginate(50);
        return AuditLogResource::collection($logs);
    }
}
