<?php

namespace App\Services;

use App\Models\HariLibur;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HolidayService
{
    /**
     * Determine the attendance schedule type for a given date.
     * Returns: 'WFH', 'WFO', or 'Libur'
     */
    public function getJadwalType(Carbon $date): string
    {
        if ($this->isHoliday($date)) {
            return 'Libur';
        }

        // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
        $dayOfWeek = $date->dayOfWeek;

        if (in_array($dayOfWeek, [Carbon::MONDAY, Carbon::WEDNESDAY, Carbon::THURSDAY])) {
            return 'WFO';
        } elseif (in_array($dayOfWeek, [Carbon::TUESDAY, Carbon::FRIDAY])) {
            return 'WFH';
        }

        return 'Libur'; // Fallback for weekends if isHoliday didn't catch it for some reason
    }

    /**
     * Check if a specific date is a holiday (weekend, manual holiday, or national holiday).
     */
    public function isHoliday(Carbon $date): bool
    {
        // 1. Check if weekend
        if ($date->isWeekend()) {
            return true;
        }

        $dateString = $date->format('Y-m-d');

        // 2. Check local database (covers both manual and synced national holidays)
        $localHoliday = HariLibur::where('tanggal', $dateString)->first();
        if ($localHoliday) {
            return true;
        }

        // 3. Fallback to check API dynamically (and cache it)
        return $this->isNationalHolidayFromApi($dateString);
    }

    /**
     * Check public API for holidays and cache the result for the month.
     */
    private function isNationalHolidayFromApi(string $dateString): bool
    {
        $date = Carbon::parse($dateString);
        $month = $date->month;
        $year = $date->year;

        $cacheKey = "holidays_{$year}_{$month}";

        $holidays = Cache::remember($cacheKey, now()->addDays(30), function () use ($year, $month) {
            try {
                // Using dayoffapi or similar open API for Indonesian holidays
                // Let's use https://dayoffapi.vercel.app/api?month=X&year=Y
                $response = Http::timeout(5)->get("https://dayoffapi.vercel.app/api", [
                    'month' => $month,
                    'year' => $year
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $holidayDates = [];
                    foreach ($data as $item) {
                        if (isset($item['is_cuti']) && $item['is_cuti'] === false && isset($item['tanggal'])) {
                            // Extract just the date part from YYYY-MM-DD
                            $holidayDates[] = $item['tanggal'];
                            
                            // Optional: Sync to database so we don't rely entirely on API next time
                            HariLibur::firstOrCreate(
                                ['tanggal' => $item['tanggal']],
                                [
                                    'keterangan' => $item['keterangan'],
                                    'is_nasional' => true
                                ]
                            );
                        }
                    }
                    return $holidayDates;
                }
            } catch (\Exception $e) {
                Log::error("Failed to fetch holidays from API: " . $e->getMessage());
            }
            return [];
        });

        return in_array($dateString, $holidays);
    }

    public function getHolidayInfo(Carbon $date): ?string
    {
        if ($date->isWeekend()) {
            return 'Akhir Pekan';
        }
        $localHoliday = HariLibur::where('tanggal', $date->format('Y-m-d'))->first();
        if ($localHoliday) {
            return $localHoliday->keterangan;
        }
        
        return null;
    }
}
