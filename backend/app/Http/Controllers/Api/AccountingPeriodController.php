<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AccountingPeriodController extends Controller {
 private function allowed(Request $r):void{abort_unless(in_array($r->user()->role,['super_admin','admin','manager','finance'],true),403);}
 public function index(Request $r){return response()->json(['data'=>DB::table('accounting_periods')->where('company_id',$r->user()->company_id)
  ->orderByDesc('ends_on')->limit(100)->get()]);}
 public function close(Request $r){$this->allowed($r);$co=(string)$r->user()->company_id;
  $data=$r->validate(['starts_on'=>['required','date'],'ends_on'=>['required','date','after_or_equal:starts_on'],'note'=>['nullable','string','max:1000']]);
  return DB::transaction(function()use($r,$co,$data){
   // Lock the tenant row so concurrent close requests cannot create overlapping periods.
   DB::table('companies')->where('id',$co)->lockForUpdate()->firstOrFail();
   $overlap=DB::table('accounting_periods')->where('company_id',$co)->where('status','closed')
    ->whereDate('starts_on','<=',$data['ends_on'])->whereDate('ends_on','>=',$data['starts_on'])->first();
   abort_if($overlap,409,'Rentang periode bertumpang tindih dengan periode yang sudah ditutup.');
   $id=(string)Str::ulid();$now=now();DB::table('accounting_periods')->insert(['id'=>$id,'company_id'=>$co,'starts_on'=>$data['starts_on'],'ends_on'=>$data['ends_on'],
    'status'=>'closed','closed_by'=>$r->user()->id,'closed_at'=>$now,'note'=>$data['note']??null,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'accounting_period.closed','accounting_period',$id,null,['starts_on'=>$data['starts_on'],'ends_on'=>$data['ends_on']]);
   return response()->json(['data'=>DB::table('accounting_periods')->find($id)],201);
  });
 }
 public function reopen(Request $r,string $id){abort_unless($r->user()->role==='super_admin',403);$co=(string)$r->user()->company_id;
  return DB::transaction(function()use($r,$co,$id){$period=DB::table('accounting_periods')->where('company_id',$co)->where('id',$id)->lockForUpdate()->first();abort_unless($period,404);
   abort_unless($period->status==='closed',409,'Periode sudah dibuka kembali.');DB::table('accounting_periods')->where('id',$id)->update(['status'=>'reopened','reopened_by'=>$r->user()->id,'reopened_at'=>now(),'updated_at'=>now()]);
   AuditService::record($r->user(),'accounting_period.reopened','accounting_period',$id,['status'=>'closed'],['status'=>'reopened']);
   return response()->json(['data'=>DB::table('accounting_periods')->find($id)]);
  });
 }
}
