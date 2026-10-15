<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as Dec;
use App\Services\AccountingPeriodService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccountingOperationsController extends Controller {
 public function options(Request $r){return response()->json(['data'=>['accounts'=>DB::table('chart_of_accounts')
  ->where('company_id',$r->user()->company_id)->orderBy('code')->get(['id','code','name','type'])]]);}
 public function index(Request $r){
  $co=$r->user()->company_id;$from=$r->input('from');$to=$r->input('to');
  $r->validate(['from'=>['nullable','date'],'to'=>['nullable','date','after_or_equal:from']]);
  $lines=DB::table('journal_lines as l')->join('journal_entries as e','e.id','=','l.journal_entry_id')
   ->join('chart_of_accounts as a','a.id','=','l.account_id')->where('e.company_id',$co)->where('e.status','posted')
   ->when($from,fn($q)=>$q->whereDate('e.posting_date','>=',$from))
   ->when($to,fn($q)=>$q->whereDate('e.posting_date','<=',$to))
   ->groupBy('a.id','a.code','a.name','a.type')
   ->select('a.id','a.code','a.name','a.type')->selectRaw('SUM(l.debit) as debit, SUM(l.credit) as credit')
   ->orderBy('a.code')->get();
  $debits=0;$credits=0;$income=0;$expense=0;
  foreach($lines as $line){$d=Dec::parse((string)$line->debit);$c=Dec::parse((string)$line->credit);
   $debits+=$d;$credits+=$c;
   if($line->type==='income')$income+=$c-$d;
   if($line->type==='expense')$expense+=$d-$c;
  }
  $lineTotals=DB::table('journal_lines')->select('journal_entry_id')
   ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')->groupBy('journal_entry_id');
  $entries=DB::table('journal_entries as e')
   ->leftJoinSub($lineTotals,'s','s.journal_entry_id','=','e.id')
   ->where('e.company_id',$co)
   ->when($from,fn($q)=>$q->whereDate('e.posting_date','>=',$from))
   ->when($to,fn($q)=>$q->whereDate('e.posting_date','<=',$to))
   ->select('e.*','s.total_debit','s.total_credit')
   ->orderByDesc('e.posting_date')->limit(150)->get();
  return response()->json(['data'=>['trial_balance'=>$lines,'total_debit'=>Dec::format($debits),
   'total_credit'=>Dec::format($credits),'balanced'=>$debits===$credits,'revenue'=>Dec::format($income),
   'expenses'=>Dec::format($expense),'profit'=>Dec::format($income-$expense),'entries'=>$entries]]);
 }
 public function postManual(Request $r){
  abort_unless(in_array($r->user()->role,['super_admin','admin','manager','finance'],true),403);
  $co=$r->user()->company_id;
  $data=$r->validate(['date'=>['required','date'],'description'=>['required','string','max:500'],
   'source_id'=>['required','ulid'], 'lines'=>['required','array','min:2','max:50'],
   'lines.*.account_id'=>['required','ulid',Rule::exists('chart_of_accounts','id')->where('company_id',$co)],
   'lines.*.debit'=>['required','numeric','min:0','decimal:0,2'],
   'lines.*.credit'=>['required','numeric','min:0','decimal:0,2']]);
  return DB::transaction(function()use($r,$co,$data){
   $existing=DB::table('journal_entries')->where('company_id',$co)->where('source_type','manual')
    ->where('source_id',$data['source_id'])->lockForUpdate()->first();
   if($existing)return response()->json(['data'=>$existing,'already_exists'=>true]);
   app(AccountingPeriodService::class)->assertOpen($co,$data['date']);
   $debit=0;$credit=0;
   foreach($data['lines'] as $l){
    $d=Dec::parse((string)$l['debit']);$c=Dec::parse((string)$l['credit']);
    if(($d>0&&$c>0)||($d===0&&$c===0))throw ValidationException::withMessages(['lines'=>'Setiap baris harus hanya debit atau kredit.']);
    $debit+=$d;$credit+=$c;
   }
   if($debit!==$credit||$debit<=0)throw ValidationException::withMessages(['lines'=>'Total debit dan kredit harus sama dan lebih dari nol.']);
   $id=(string)Str::ulid();$now=now();
   DB::table('journal_entries')->insert(['id'=>$id,'company_id'=>$co,'number'=>'JRN-'.strtoupper((string)Str::ulid()),
    'posting_date'=>$data['date'],'description'=>$data['description'],'status'=>'posted',
    'source_type'=>'manual','source_id'=>$data['source_id'],'created_at'=>$now,'updated_at'=>$now]);
   foreach($data['lines'] as $l)DB::table('journal_lines')->insert(['id'=>(string)Str::ulid(),'journal_entry_id'=>$id,
    'account_id'=>$l['account_id'],'debit'=>$l['debit'],'credit'=>$l['credit'],'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'journal.posted','journal_entry',$id,null,['debit'=>Dec::format($debit),'lines'=>count($data['lines'])]);
   return response()->json(['data'=>DB::table('journal_entries')->find($id)],201);
  });
 }
}
