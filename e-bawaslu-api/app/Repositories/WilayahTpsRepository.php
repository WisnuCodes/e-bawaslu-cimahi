<?php

namespace App\Repositories;

use App\Models\WilayahTps;
use Illuminate\Support\Facades\Cache;

class WilayahTpsRepository
{
    /**
     * Get all Wilayah TPS with caching.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllCached()
    {
        return Cache::rememberForever('wilayah_tps_all', function () {
            return WilayahTps::all();
        });
    }

    /**
     * Invalidate the cache for Wilayah TPS.
     *
     * @return void
     */
    public function invalidateCache()
    {
        Cache::forget('wilayah_tps_all');
    }
}
