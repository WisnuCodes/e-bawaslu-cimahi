<?php

namespace App\Observers;

use App\Models\WilayahTps;
use Illuminate\Support\Facades\Cache;

class WilayahTpsObserver
{
    /**
     * Handle the WilayahTps "created" event.
     */
    public function created(WilayahTps $wilayahTps): void
    {
        Cache::forget('wilayah_tps_all');
    }

    /**
     * Handle the WilayahTps "updated" event.
     */
    public function updated(WilayahTps $wilayahTps): void
    {
        Cache::forget('wilayah_tps_all');
    }

    /**
     * Handle the WilayahTps "deleted" event.
     */
    public function deleted(WilayahTps $wilayahTps): void
    {
        Cache::forget('wilayah_tps_all');
    }

    /**
     * Handle the WilayahTps "restored" event.
     */
    public function restored(WilayahTps $wilayahTps): void
    {
        //
    }

    /**
     * Handle the WilayahTps "force deleted" event.
     */
    public function forceDeleted(WilayahTps $wilayahTps): void
    {
        //
    }
}
