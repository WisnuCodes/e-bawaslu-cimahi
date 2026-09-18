<?php

namespace App\Observers;

use App\Models\Divisi;
use Illuminate\Support\Facades\Cache;

class DivisiObserver
{
    /**
     * Handle the Divisi "created" event.
     */
    public function created(Divisi $divisi): void
    {
        Cache::forget('divisi_all');
    }

    /**
     * Handle the Divisi "updated" event.
     */
    public function updated(Divisi $divisi): void
    {
        Cache::forget('divisi_all');
    }

    /**
     * Handle the Divisi "deleted" event.
     */
    public function deleted(Divisi $divisi): void
    {
        Cache::forget('divisi_all');
    }

    /**
     * Handle the Divisi "restored" event.
     */
    public function restored(Divisi $divisi): void
    {
        //
    }

    /**
     * Handle the Divisi "force deleted" event.
     */
    public function forceDeleted(Divisi $divisi): void
    {
        //
    }
}
