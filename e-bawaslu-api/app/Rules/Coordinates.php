<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Coordinates implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $parts = is_string($value) ? explode(',', $value) : [];
        if (count($parts) !== 2 || !is_numeric(trim($parts[0])) || !is_numeric(trim($parts[1]))
            || abs((float) $parts[0]) > 90 || abs((float) $parts[1]) > 180) {
            $fail('Koordinat harus berupa latitude, longitude yang valid.');
        }
    }
}
