<?php

namespace App\Http\Requests\C1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreC1Request extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tps_id' => 'required|uuid',
            'total_suara_sah' => 'required|integer|min:0',
            'total_suara_tidak_sah' => 'required|integer|min:0',
            'total_pemilih' => 'required|integer|min:0',
            'file_c1' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ];
    }
}
