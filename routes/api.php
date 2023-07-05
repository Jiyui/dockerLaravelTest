<?php

use App\Http\Controllers\FileController;
use App\Http\Controllers\PdfSignerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->post('/pdf', [PdfSignerController::class, 'store'])->name('api.pdf.store');
Route::get('/files/{filename}', [FileController::class, 'show'])->name('api.file.show');
