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
        return \App\Support\C1Access::write($this->user());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'jenis_pemilihan' => 'sometimes|in:Pemilu,Pilkada',
            'sub_jenis_pemilihan' => 'nullable|string|max:100',
            'tps_id' => 'required|uuid|exists:wilayah_tps,tps_id',
            'suara_paslon' => 'nullable|json',
            'total_suara_sah' => 'required|integer|min:0',
            'total_suara_tidak_sah' => 'required|integer|min:0',
            'total_pemilih' => 'required|integer|min:0',
            'file_c1' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ];
    }
}
