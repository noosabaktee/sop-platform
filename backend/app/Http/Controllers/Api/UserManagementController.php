<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Real company-scoped user management; never lets the browser set company_id. */
class UserManagementController extends Controller{
 private function allowed(Request $r):void {abort_unless(in_array($r->user()->role,['super_admin','admin'],true),403);}
 private function query(Request $r){return DB::table('users as u')->leftJoin('user_profiles as p','p.user_id','=','u.id')->where('u.company_id',$r->user()->company_id);}
 public function index(Request $r){$this->allowed($r);return response()->json(['data'=>$this->query($r)->orderBy('u.name')->get(['u.id','u.name','u.email','u.role','u.is_active','p.department_name'])]);}
 public function create(Request $r){
  $this->allowed($r);
  $data=$r->validate(['name'=>['required','string','max:255'],'email'=>['required','email','max:255',Rule::unique('users','email')],
   'role'=>['required',Rule::in(['admin','manager','sales','finance','procurement','warehouse','project_manager','user','viewer'])],
   'department_name'=>['nullable','string','max:150'],'password'=>['nullable',Password::min(12)->mixedCase()->numbers()],
   'is_active'=>['sometimes','boolean']]);
  abort_if($data['role']==='admin' && $r->user()->role!=='super_admin',403,'Hanya super admin yang boleh membuat admin.');
  // An account without an initial password remains disabled until a secure reset/invite setup is completed.
  return DB::transaction(function()use($r,$data){
   $id=(string)Str::ulid();$hasPassword=!empty($data['password']);
   $active=$hasPassword && ($data['is_active']??false);
   DB::table('users')->insert(['id'=>$id,'company_id'=>$r->user()->company_id,'name'=>$data['name'],'email'=>mb_strtolower($data['email']),
    'role'=>$data['role'],'password'=>Hash::make($data['password']??Str::random(72)),'is_active'=>$active,'created_at'=>now(),'updated_at'=>now()]);
   DB::table('user_profiles')->insert(['user_id'=>$id,'department_name'=>$data['department_name']??null,'created_at'=>now(),'updated_at'=>now()]);
   AuditService::record($r->user(),'user.created','user',$id,null,['email'=>$data['email'],'role'=>$data['role'],'is_active'=>$active]);
   return response()->json(['data'=>$this->query($r)->where('u.id',$id)->first(['u.id','u.name','u.email','u.role','u.is_active','p.department_name'])],201);
  });
 }
 public function update(Request $r,string $id){
  $this->allowed($r);
  $data=$r->validate(['name'=>['sometimes','required','string','max:255'],
   'email'=>['sometimes','required','email','max:255',Rule::unique('users','email')->ignore($id)],
   'role'=>['sometimes',Rule::in(['admin','manager','sales','finance','procurement','warehouse','project_manager','user','viewer'])],
   'department_name'=>['sometimes','nullable','string','max:150'],'is_active'=>['sometimes','boolean'],
   'password'=>['sometimes','required',Password::min(12)->mixedCase()->numbers()]]);
  return DB::transaction(function()use($r,$data,$id){
   $q=DB::table('users')->where('company_id',$r->user()->company_id)->where('id',$id);
   $before=$q->lockForUpdate()->first();abort_unless($before,404);
   if($id===$r->user()->id)abort_if(isset($data['is_active'])&&$data['is_active']===false || isset($data['role'])&&$data['role']!==$before->role,409,'Tidak dapat menonaktifkan atau mengubah role akun sendiri.');
   if($before->role==='super_admin')abort_unless($r->user()->role==='super_admin',403);
   if(($data['role']??null)==='admin' && $r->user()->role!=='super_admin')abort(403,'Hanya super admin yang dapat menetapkan role admin.');
   $changes=array_intersect_key($data,array_flip(['name','email','role','is_active']));
   if(isset($changes['email']))$changes['email']=mb_strtolower($changes['email']);
   if(isset($data['password']))$changes['password']=Hash::make($data['password']);
   $q->update([...$changes,'updated_at'=>now()]);
   if(array_key_exists('department_name',$data))DB::table('user_profiles')->updateOrInsert(['user_id'=>$id],['department_name'=>$data['department_name'],'updated_at'=>now()]);
   AuditService::record($r->user(),'user.updated','user',$id,['role'=>$before->role,'is_active'=>$before->is_active],['role'=>$data['role']??$before->role,'is_active'=>$data['is_active']??$before->is_active]);
   return response()->json(['data'=>$this->query($r)->where('u.id',$id)->first(['u.id','u.name','u.email','u.role','u.is_active','p.department_name'])]);
  });
 }
 public function deactivate(Request $r,string $id){
  $this->allowed($r);abort_if($id===$r->user()->id,409,'Tidak dapat menonaktifkan diri sendiri.');
  return DB::transaction(function()use($r,$id){
   $q=DB::table('users')->where('company_id',$r->user()->company_id)->where('id',$id);
   $before=$q->lockForUpdate()->first();abort_unless($before,404);
   if($before->role==='super_admin')abort_unless($r->user()->role==='super_admin',403);
   $q->update(['is_active'=>false,'updated_at'=>now()]);
   DB::table('sessions')->where('user_id',$id)->delete();
   DB::table('personal_access_tokens')->where('tokenable_type','App\\Models\\User')->where('tokenable_id',$id)->delete();
   AuditService::record($r->user(),'user.deactivated','user',$id,['is_active'=>$before->is_active],['is_active'=>false]);
   return response()->noContent();
  });
 }
}
