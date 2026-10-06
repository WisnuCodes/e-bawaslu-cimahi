<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        // Konversi empty string ke null untuk field nullable
        $nullableFields = ['divisi_id', 'tps_id', 'whatsapp_number'];
        foreach ($nullableFields as $field) {
            if ($this->has($field) && $this->input($field) === '') {
                $this->merge([$field => null]);
            }
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $role = strtolower($this->user()->role ?? '');
        return str_contains($role, 'admin') || str_contains($role, 'superadmin') || str_contains($role, 'ketua');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Parameter in routes/api.php is usually 'id', so we check for 'id' first
        $userId = $this->route('id') ?? $this->route('user');

        if ($this->isMethod('post')) {
            return [
                'username' => 'required|string|max:50|unique:users',
                'email' => 'required|email|max:100|unique:users',
                'whatsapp_number' => 'nullable|string|max:20',
                'password' => 'nullable|string|min:6',
                'role' => 'required|string|max:30',
                'divisi_id' => 'nullable|uuid|exists:divisi,divisi_id',
                'tps_id' => 'nullable|uuid|exists:wilayah_tps,tps_id',
                'status_aktif' => 'nullable|boolean',
                'koordinat_acuan' => ['nullable', 'string', 'regex:/^[-]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-]?(1[0-7]\d(\.\d+)?|[1-9]?\d(\.\d+)?|180(\.0+)?)$/']
            ];
        }

        return [
            'username' => 'sometimes|string|max:50|unique:users,username,'.$userId.',user_id',
            'email' => 'sometimes|email|max:100|unique:users,email,'.$userId.',user_id',
            'whatsapp_number' => 'nullable|string|max:20',
            'role' => 'sometimes|string|max:30',
            'divisi_id' => 'nullable|uuid|exists:divisi,divisi_id',
            'tps_id' => 'nullable|uuid|exists:wilayah_tps,tps_id',
            'status_aktif' => 'nullable|boolean',
            'koordinat_acuan' => ['nullable', 'string', 'regex:/^[-]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-]?(1[0-7]\d(\.\d+)?|[1-9]?\d(\.\d+)?|180(\.0+)?)$/']
        ];
    }
}
