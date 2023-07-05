<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use function PHPUnit\Framework\isEmpty;

class ValidPnpki implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $certFile = request()->file('certFile');
        $certFile_file_name = Str::random(20);
        $certFile_file_ext = $certFile->getClientOriginalExtension();
        $certFileNameExt = "$certFile_file_name.$certFile_file_ext";

        $certFile_path = Storage::putFileAs('public', $certFile, $certFileNameExt);

        $certFile_abs_path = storage_path("app/$certFile_path");

        $certs = array();
        $pkcs12 = file_get_contents($certFile_abs_path);
        openssl_pkcs12_read($pkcs12, $certs, request('password'));

        unlink($certFile_abs_path);

        if ($certs == array()) {
            $fail('The :attribute field is invalid.');
        }

    }
}
