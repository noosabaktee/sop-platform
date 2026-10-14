<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use App\Services\AuditService;
use App\Services\TotpService;
class AuthController extends Controller {
 public function login(Request $request){
  $creds=$request->validate(['email'=>['required','email'],'password'=>['required','string']]);
  $email=strtolower(trim($creds['email']));$key='login:'.$email.'|'.$request->ip();
  if(RateLimiter::tooManyAttempts($key,5))return response()->json(['message'=>'Akun terkunci sementara karena terlalu banyak percobaan.','retry_after'=>RateLimiter::availableIn($key)],423);
  $user=\App\Models\User::whereRaw('lower(email) = ?',[$email])->first();
  $attempt=['email'=>$email,'password'=>$creds['password'],'is_active'=>true];
  if(!Auth::attempt($attempt)){
   RateLimiter::hit($key,900);$this->loginEvent($request,$user,false,$user&&!$user->is_active?'inactive':'invalid_credentials');
   throw ValidationException::withMessages(['email'=>['Email atau kata sandi salah.']]);
  }
  $request->session()->regenerate();$user=$request->user();RateLimiter::clear($key);
  if($user->two_factor_confirmed_at&&$user->two_factor_secret){
   $request->session()->put(['login.two_factor_user'=>$user->id,'login.remember'=>$request->boolean('remember')]);
   Auth::guard('web')->logout();return response()->json(['requires_two_factor'=>true],202);
  }
  $this->loginEvent($request,$user,true,null);AuditService::record($user,'login','user',$user->id);
  return response()->json(['data'=>$user->only('id','company_id','name','email','role')]);
 }
 public function twoFactorChallenge(Request $request,TotpService $totp){
  $data=$request->validate(['code'=>['required','string','max:32']]);$id=$request->session()->get('login.two_factor_user');
  abort_unless($id,409,'Tidak ada challenge 2FA aktif. Silakan login kembali.');
  $user=\App\Models\User::where('id',$id)->where('is_active',true)->firstOrFail();$valid=$totp->verify((string)$user->two_factor_secret,$data['code']);
  if(!$valid){$codes=$user->two_factor_recovery_codes?:[];$index=array_search(strtolower($data['code']),array_map('strtolower',$codes),true);
   if($index!==false){unset($codes[$index]);$user->forceFill(['two_factor_recovery_codes'=>array_values($codes)])->save();$valid=true;}}
  if(!$valid)throw ValidationException::withMessages(['code'=>['Kode autentikasi tidak valid.']]);
  Auth::guard('web')->login($user,(bool)$request->session()->pull('login.remember',false));$request->session()->forget('login.two_factor_user');$request->session()->regenerate();
  $this->loginEvent($request,$user,true,null);AuditService::record($user,'login.2fa','user',$user->id);
  return response()->json(['data'=>$user->only('id','company_id','name','email','role')]);
 }
 public function twoFactorSetup(Request $request,TotpService $totp){
  $secret=$totp->secret();$request->session()->put('two_factor_setup_secret',$secret);$issuer=rawurlencode((string)config('app.name','SOP Platform'));
  return response()->json(['data'=>['secret'=>$secret,'otpauth_url'=>'otpauth://totp/'.$issuer.':'.rawurlencode($request->user()->email).'?secret='.$secret.'&issuer='.$issuer]]);
 }
 public function twoFactorEnable(Request $request,TotpService $totp){
  $data=$request->validate(['code'=>['required','digits:6']]);$secret=(string)$request->session()->get('two_factor_setup_secret');
  abort_unless($secret,409,'Mulai setup 2FA terlebih dahulu.');
  if(!$totp->verify($secret,$data['code']))throw ValidationException::withMessages(['code'=>['Kode authenticator tidak valid.']]);
  $codes=$totp->recoveryCodes();$request->user()->forceFill(['two_factor_secret'=>$secret,'two_factor_recovery_codes'=>$codes,'two_factor_confirmed_at'=>now()])->save();
  $request->session()->forget('two_factor_setup_secret');AuditService::record($request->user(),'2fa.enabled','user',$request->user()->id);
  return response()->json(['data'=>['recovery_codes'=>$codes]]);
 }
 public function twoFactorDisable(Request $request){
  $data=$request->validate(['password'=>['required','current_password']]);$request->user()->forceFill(['two_factor_secret'=>null,'two_factor_recovery_codes'=>null,'two_factor_confirmed_at'=>null])->save();
  AuditService::record($request->user(),'2fa.disabled','user',$request->user()->id);return response()->noContent();
 }
 private function loginEvent(Request $request,?\App\Models\User $user,bool $successful,?string $reason):void{
  DB::table('login_events')->insert(['id'=>(string)Str::ulid(),'company_id'=>$user?->company_id,'user_id'=>$user?->id,
   'email'=>$user?->email ?: strtolower((string)$request->input('email')),'successful'=>$successful,'reason'=>$reason,
   'ip_address'=>$request->ip(),'user_agent'=>substr((string)$request->userAgent(),0,1000),'created_at'=>now()]);
 }
 public function forgotPassword(Request $request){
  $data=$request->validate(['email'=>['required','email']]);$email=strtolower(trim($data['email']));
  $user=\App\Models\User::whereRaw('lower(email) = ?',[$email])->where('is_active',true)->first();
  if($user){
   $token=Str::random(64);DB::table('password_reset_tokens')->updateOrInsert(['email'=>$user->email],['token'=>Hash::make($token),'created_at'=>now()]);
   $url=rtrim((string)config('app.url'),'/').'/reset-password?email='.urlencode($user->email).'&token='.urlencode($token);
   Mail::raw("Gunakan tautan berikut untuk mengatur ulang kata sandi SOP Platform (berlaku 30 menit):\n\n{$url}",
    fn($message)=>$message->to($user->email)->subject('Reset kata sandi SOP Platform'));
  }
  return response()->json(['message'=>'Jika email terdaftar, tautan reset telah dikirim.'],202);
 }
 public function resetPassword(Request $request){
  $data=$request->validate(['email'=>['required','email'],'token'=>['required','string'],
   'password'=>['required','confirmed',Password::min(12)->mixedCase()->numbers()]]);
  $record=DB::table('password_reset_tokens')->where('email',$data['email'])->first();
  if(!$record||now()->diffInMinutes($record->created_at,true)>30||!Hash::check($data['token'],$record->token))
   throw ValidationException::withMessages(['token'=>['Token reset tidak valid atau sudah kedaluwarsa.']]);
  $user=\App\Models\User::where('email',$data['email'])->where('is_active',true)->firstOrFail();
  DB::transaction(function()use($user,$data){$user->update(['password'=>$data['password']]);DB::table('password_reset_tokens')->where('email',$user->email)->delete();DB::table('sessions')->where('user_id',$user->id)->delete();AuditService::record($user,'password.reset','user',$user->id);});
  return response()->json(['message'=>'Kata sandi berhasil diubah. Silakan masuk kembali.']);
 }
 public function loginHistory(Request $request){
  return response()->json(['data'=>DB::table('login_events')->where('company_id',$request->user()->company_id)
   ->when(!in_array($request->user()->role,['super_admin','admin','auditor'],true),fn($q)=>$q->where('user_id',$request->user()->id))
   ->orderByDesc('created_at')->limit(100)->get()]);
 }
 public function sessions(Request $request){
  $current=$request->session()->getId();
  $sessions=DB::table('sessions')->where('user_id',$request->user()->id)->orderByDesc('last_activity')->get()
   ->map(fn($session)=>['id'=>$session->id,'ip_address'=>$session->ip_address,'user_agent'=>$session->user_agent,
    'last_activity'=>date(DATE_ATOM,$session->last_activity),'current'=>hash_equals($current,$session->id)]);
  return response()->json(['data'=>$sessions]);
 }
 public function revokeSession(Request $request,string $id){
  abort_if(hash_equals($request->session()->getId(),$id),409,'Sesi aktif tidak dapat dicabut dari halaman ini. Gunakan logout.');
  $deleted=DB::table('sessions')->where('user_id',$request->user()->id)->where('id',$id)->delete();abort_unless($deleted,404);
  AuditService::record($request->user(),'session.revoked','session',$id);return response()->noContent();
 }
 public function revokeOtherSessions(Request $request){
  $current=$request->session()->getId();$ids=DB::table('sessions')->where('user_id',$request->user()->id)->where('id','<>',$current)->pluck('id');
  DB::table('sessions')->whereIn('id',$ids)->delete();
  foreach($ids as $id)AuditService::record($request->user(),'session.revoked','session',$id);
  return response()->json(['revoked'=>$ids->count()]);
 }
 public function me(Request $request){return response()->json(['data'=>$request->user()->only('id','company_id','name','email','role')]);}
 public function logout(Request $request){$user=$request->user();AuditService::record($user,'logout','user',$user->id);Auth::guard('web')->logout();$request->session()->invalidate();$request->session()->regenerateToken();return response()->noContent();}
}
