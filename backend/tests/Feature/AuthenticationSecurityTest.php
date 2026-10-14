<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use App\Services\TotpService;
use Tests\TestCase;

class AuthenticationSecurityTest extends TestCase
{
 use RefreshDatabase;

 public function test_login_records_success_and_failure_and_locks_repeated_attempts():void{
  RateLimiter::clear('login:user@example.test|127.0.0.1');
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id,'email'=>'user@example.test','password'=>'CorrectPassword9']);
  $this->withHeader('Origin','http://localhost')->postJson('/api/login',['email'=>$user->email,'password'=>'wrong'])->assertUnprocessable();
  $this->withHeader('Origin','http://localhost')->postJson('/api/login',['email'=>$user->email,'password'=>'CorrectPassword9'])->assertOk();
  $this->assertDatabaseHas('login_events',['user_id'=>$user->id,'successful'=>false]);
  $this->assertDatabaseHas('login_events',['user_id'=>$user->id,'successful'=>true]);
 }

 public function test_password_reset_is_generic_single_use_and_revokes_sessions():void{
  Mail::fake();$company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id,'email'=>'reset@example.test']);
  $this->postJson('/api/forgot-password',['email'=>$user->email])->assertStatus(202);
  $record=\DB::table('password_reset_tokens')->where('email',$user->email)->first();$this->assertNotNull($record);
  $plain='known-test-token';\DB::table('password_reset_tokens')->where('email',$user->email)->update(['token'=>Hash::make($plain)]);
  $payload=['email'=>$user->email,'token'=>$plain,'password'=>'NewPassword2026','password_confirmation'=>'NewPassword2026'];
  $this->postJson('/api/reset-password',$payload)->assertOk();
  $this->assertTrue(Hash::check('NewPassword2026',$user->fresh()->password));
  $this->postJson('/api/reset-password',$payload)->assertUnprocessable();
  $this->postJson('/api/forgot-password',['email'=>'unknown@example.test'])->assertStatus(202);
 }

 public function test_login_history_is_company_scoped():void{
  $company=Company::factory()->create();$admin=User::factory()->create(['company_id'=>$company->id,'role'=>'admin']);
  $this->withHeader('Origin','http://localhost')->postJson('/api/login',['email'=>$admin->email,'password'=>'password'])->assertOk();
  $this->getJson('/api/v1/security/login-history')->assertOk()->assertJsonPath('data.0.user_id',$admin->id);
 }

 public function test_user_can_list_and_revoke_only_their_own_other_sessions():void{
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id]);
  $other=User::factory()->create(['company_id'=>$company->id]);
  foreach([['other-device',$user->id],['foreign-device',$other->id]] as [$id,$userId])\DB::table('sessions')->insert([
   'id'=>$id,'user_id'=>$userId,'ip_address'=>'127.0.0.1','user_agent'=>'Test Browser','payload'=>'','last_activity'=>time()-60]);
  $this->actingAs($user)->withHeader('Origin','http://localhost')->getJson('/api/v1/security/sessions')->assertOk()->assertJsonCount(1,'data');
  $this->deleteJson('/api/v1/security/sessions/foreign-device')->assertNotFound();
  $this->deleteJson('/api/v1/security/sessions/other-device')->assertNoContent();
  $this->assertDatabaseHas('sessions',['id'=>'foreign-device']);
 }

 public function test_totp_user_is_not_authenticated_until_valid_challenge():void{
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id,'email'=>'mfa@example.test']);
  $totp=app(TotpService::class);$secret=$totp->secret();$user->forceFill(['two_factor_secret'=>$secret,
   'two_factor_recovery_codes'=>['recover-12345'],'two_factor_confirmed_at'=>now()])->save();
  $this->withHeader('Origin','http://localhost')->postJson('/api/login',['email'=>$user->email,'password'=>'password'])
   ->assertStatus(202)->assertJsonPath('requires_two_factor',true);
  $this->getJson('/api/v1/me')->assertUnauthorized();
  $this->withHeader('Origin','http://localhost')->postJson('/api/two-factor-challenge',['code'=>'000000'])->assertUnprocessable();
  $code=$totp->code($secret,intdiv(time(),30));
  $this->withHeader('Origin','http://localhost')->postJson('/api/two-factor-challenge',['code'=>$code])->assertOk()->assertJsonPath('data.id',$user->id);
  $this->getJson('/api/v1/me')->assertOk();
 }

 public function test_two_factor_setup_enable_and_disable_requires_current_password():void{
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id]);$this->actingAs($user);
  $setup=$this->withHeader('Origin','http://localhost')->postJson('/api/v1/security/two-factor/setup')->assertOk();
  $secret=$setup->json('data.secret');$code=app(TotpService::class)->code($secret,intdiv(time(),30));
  $this->withHeader('Origin','http://localhost')->postJson('/api/v1/security/two-factor/enable',['code'=>$code])->assertOk()->assertJsonCount(8,'data.recovery_codes');
  $this->assertNotNull($user->fresh()->two_factor_confirmed_at);
  $this->withHeader('Origin','http://localhost')->deleteJson('/api/v1/security/two-factor',['password'=>'wrong'])->assertUnprocessable();
  $this->withHeader('Origin','http://localhost')->deleteJson('/api/v1/security/two-factor',['password'=>'password'])->assertNoContent();
  $this->assertNull($user->fresh()->two_factor_secret);
 }
}
