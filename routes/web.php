<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    Auth::logout();
    return view('welcome');
});

Route::get('auth/google', [AuthController::class, 'signInwithGoogle']);
Route::get('auth/logout', [AuthController::class, 'logout']);
Route::get('callback/google', [AuthController::class, 'callbackToGoogle']);