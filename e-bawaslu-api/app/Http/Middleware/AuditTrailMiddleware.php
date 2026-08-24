<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class AuditTrailMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->method() !== 'GET') {
            $payload = json_encode($request->except(['password', 'password_confirmation', 'document', 'selfie', 'file_c1', 'file_dokumen', 'attachment']));
            
            \App\Models\AuditLog::create([
                'log_id' => (string) \Illuminate\Support\Str::uuid(),
                'actor_id' => $request->user()?->user_id,
                'action' => $request->method(),
                'target_entity' => $request->path(),
                'ip_address' => $request->ip(),
                'reason' => 'Payload: ' . substr($payload, 0, 500),
                'timestamp' => \Carbon\Carbon::now(),
            ]);
        }

        return $response;
    }
}
