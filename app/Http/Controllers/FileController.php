<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function show(Request $request, $filename){
        if($request->view == 1){
            return Storage::response("public/$filename");
        }else{
            return Storage::download("public/$filename");
        }
    }
}
