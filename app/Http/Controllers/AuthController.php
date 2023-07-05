<?php

namespace App\Http\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function logout() {
        Auth::logout();
        return redirect(config('services.client.url'));
    }

    public function signInwithGoogle()
    {
        return Socialite::driver('google')->redirect();
    }
    public function callbackToGoogle()
    {
        try {
     
            $user = Socialite::driver('google')->user();
            $finduser = User::where('gauth_id', $user->id)->first();
      
            if($finduser){
                Auth::login($finduser);
                return redirect(config('services.client.url'));      
            }else{
                $newUser = User::create([
                    'name' => $user->name,
                    'email' => $user->email,
                    'gauth_id'=> $user->id,
                    'gauth_type'=> 'google',
                    'password' => encrypt('admin@123')
                ]);
     
                Auth::login($newUser);
                return redirect(config('services.client.url'));
      
            }
     
        } catch (Exception $e) {
            dd($e->getMessage());
        }
    }
}
