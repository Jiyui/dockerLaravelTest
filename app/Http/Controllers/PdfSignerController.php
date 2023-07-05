<?php

namespace App\Http\Controllers;

use App\Http\Requests\PdfSignerStoreRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfSignerController extends Controller
{
    public function store(PdfSignerStoreRequest $request) {

        $pdfFile = $request->file('pdfFile');
        $pdfFile_file_name = Str::random(20);
        $pdfFile_file_ext = $pdfFile->getClientOriginalExtension();
        $pdfFileNameExt = "$pdfFile_file_name.$pdfFile_file_ext";
        
        $signFile = $request->file('signFile');
        $signFile_file_name = Str::random(20);
        $signFile_file_ext = $signFile->getClientOriginalExtension();
        $signFileNameExt = "$signFile_file_name.$signFile_file_ext";

        $certFile = $request->file('certFile');
        $certFile_file_name = Str::random(20);
        $certFile_file_ext = $certFile->getClientOriginalExtension();
        $certFileNameExt = "$certFile_file_name.$certFile_file_ext";

        $pdfFile_path = Storage::putFileAs('public', $request->file('pdfFile'), $pdfFileNameExt);
        $signFile_path = Storage::putFileAs('public', $request->file('signFile'), $signFileNameExt);
        $certFile_path = Storage::putFileAs('public', $request->file('certFile'), $certFileNameExt);

        $pdfFile_abs_path = storage_path("app/$pdfFile_path");
        $signFile_abs_path = storage_path("app/$signFile_path");
        $certFile_abs_path = storage_path("app/$certFile_path");

        $certs = array();
        $pkcs12 = file_get_contents($certFile_abs_path);
        openssl_pkcs12_read($pkcs12, $certs, $request->password);
        $cert = openssl_x509_read($certs['cert']);
        $certInfo = openssl_x509_parse($cert);

        $certInfo = [
            "keyUsage" => $certInfo['extensions']['keyUsage'],
            "issuer" => $certInfo['issuer'],
            "serialNumber" => $certInfo['serialNumber'],
            "subject" => $certInfo['subject'],
            "validFrom" => Carbon::parse($certInfo['validFrom_time_t'])->toDateTimeString(),
            "validTo" => Carbon::parse($certInfo['validTo_time_t'])->toDateTimeString(),
            "version" => $certInfo['version'],
        ];

        $response = Http::asForm()->post(config('services.node_signer.url'), [
            'pdfFile' => $pdfFileNameExt,
            'signFile' => $signFileNameExt,
            'certFile' => $certFileNameExt,
            'password' => $request->password,
            'certInfo' => $certInfo
        ]);

        unlink($pdfFile_abs_path);
        unlink($signFile_abs_path);
        unlink($certFile_abs_path);

        $response_collection = $response->collect();
        $signed_pdf = $response_collection['files']['signedPdf'];
        return [
            "result_url" => url(route('api.file.show', $signed_pdf))
        ];
    }
}