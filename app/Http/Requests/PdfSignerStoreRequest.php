<?php

namespace App\Http\Requests;

use App\Rules\ValidPnpki;
use Illuminate\Foundation\Http\FormRequest;

class PdfSignerStoreRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', new ValidPnpki],
            'certFile' => ['required', 'file', 'mimetypes:application/octet-stream,application/x-pkcs12'],
            'pdfFile' => ['required', 'file', 'mimetypes:application/pdf'],
            'signFile' => ['required', 'file', 'mimetypes:image/jpeg,image/png,image/gif'],
        ];
    }
}
