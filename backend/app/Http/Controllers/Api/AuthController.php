<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Services\AuditService;
class AuthController extends Controller {
 public function login(Request $request){$creds=$request->validate(['email'=>['required','email'],'password'=>['required','string']]);$creds['is_active']=true;
  if(!Auth::attempt($creds))throw ValidationException::withMessages(['email'=>['Email atau kata sandi salah.']]);
  $request->session()->regenerate();$user=$request->user();AuditService::record($user,'login','user',$user->id);return response()->json(['data'=>$user->only('id','company_id','name','email','role')]);}
 public function me(Request $request){return response()->json(['data'=>$request->user()->only('id','company_id','name','email','role')]);}
 public function logout(Request $request){$user=$request->user();AuditService::record($user,'logout','user',$user->id);Auth::guard('web')->logout();$request->session()->invalidate();$request->session()->regenerateToken();return response()->noContent();}
}
