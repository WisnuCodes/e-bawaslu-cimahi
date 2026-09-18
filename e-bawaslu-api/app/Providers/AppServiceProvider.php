<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') !== 'local') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        \App\Models\Divisi::observe(\App\Observers\DivisiObserver::class);
        \App\Models\WilayahTps::observe(\App\Observers\WilayahTpsObserver::class);

        \Illuminate\Support\Facades\Gate::define('is-super-admin', function ($user) {
            return $user->role && $user->role->code === 'SAD';
        });

        \Illuminate\Support\Facades\Gate::define('is-admin', function ($user) {
            return $user->role && in_array($user->role->code, ['SAD', 'ADM']);
        });

        \Illuminate\Support\Facades\Gate::define('is-kadiv', function ($user) {
            return $user->role && in_array($user->role->code, ['SAD', 'ADM', 'KDV']);
        });

        \Illuminate\Support\Facades\Gate::define('is-staf', function ($user) {
            return $user->role && $user->role->code === 'STF';
        });
    }
}
