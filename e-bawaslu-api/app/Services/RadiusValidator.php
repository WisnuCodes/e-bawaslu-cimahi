<?php

namespace App\Services;

class RadiusValidator
{
    /**
     * Default radius dalam kilometer.
     */
    const DEFAULT_RADIUS_KM = 1.0;

    /**
     * Menghitung jarak antara dua koordinat menggunakan formula Haversine.
     *
     * @param float $lat1 Latitude titik 1
     * @param float $lon1 Longitude titik 1
     * @param float $lat2 Latitude titik 2
     * @param float $lon2 Longitude titik 2
     * @return float Jarak dalam kilometer
     */
    public static function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Radius bumi dalam kilometer

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Validasi apakah koordinat user berada dalam radius yang ditentukan
     * dari koordinat acuan.
     *
     * @param string $koordinatAcuan Format: "lat,lon" (dari profil user)
     * @param float $currentLat Latitude lokasi saat ini
     * @param float $currentLon Longitude lokasi saat ini
     * @param float|null $maxRadiusKm Radius maksimum (default 1 km)
     * @return array ['valid' => bool, 'distance_km' => float, 'max_radius_km' => float]
     */
    public static function validate(
        string $koordinatAcuan,
        float $currentLat,
        float $currentLon,
        ?float $maxRadiusKm = null
    ): array {
        $maxRadius = $maxRadiusKm ?? self::DEFAULT_RADIUS_KM;

        // Parse koordinat acuan "lat,lon"
        $parts = explode(',', $koordinatAcuan);
        if (count($parts) !== 2) {
            return [
                'valid' => false,
                'distance_km' => -1,
                'max_radius_km' => $maxRadius,
                'error' => 'Format koordinat_acuan tidak valid. Gunakan format: lat,lon'
            ];
        }

        $refLat = (float) trim($parts[0]);
        $refLon = (float) trim($parts[1]);

        $distance = self::haversineDistance($refLat, $refLon, $currentLat, $currentLon);

        return [
            'valid' => $distance <= $maxRadius,
            'distance_km' => round($distance, 3),
            'max_radius_km' => $maxRadius
        ];
    }
}
