<?php

namespace App\Http\Requests\Arsip;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreArsipRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'divisi_id' => 'required|uuid',
            'no_surat' => 'required|string|max:100',
            'tgl_surat' => 'required|date',
            'perihal' => 'required|string|max:255',
            'kategori' => 'required|string|max:50',
            'klasifikasi' => 'required|string|max:50',
            'file_dokumen' => 'required|file|mimes:pdf,docx,xlsx|max:10240',
        ];
    }
}
