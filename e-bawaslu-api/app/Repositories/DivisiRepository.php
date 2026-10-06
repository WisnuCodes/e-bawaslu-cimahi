<?php

namespace App\Repositories;

use App\Models\Divisi;
use Illuminate\Support\Facades\Cache;

class DivisiRepository
{
    /**
     * Get all Divisi with caching.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllCached()
    {
        return Cache::rememberForever('divisi_all_array', function () {
            return Divisi::all()->toArray();
        });
    }

    /**
     * Invalidate the cache for Divisi.
     *
     * @return void
     */
    public function invalidateCache()
    {
        Cache::forget('divisi_all');
    }
}
