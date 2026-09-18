<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtCookieMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->cookie('jwt_token')) {
            $request->headers->set('Authorization', 'Bearer ' . $request->cookie('jwt_token'));
        }
        return $next($request);
    }
}
