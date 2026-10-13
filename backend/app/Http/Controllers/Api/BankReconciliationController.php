<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as D;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
class BankReconciliationController extends Controller {
 private function canEdit(Request $r):void {abort_unless(in_array($r->user()->role,['super_admin','admin','manager','finance'],true),403);}
 public function index(Request $r){$co=$r->user()->company_id;
  $balances=DB::table('journal_lines as jl')->join('journal_entries as j','j.id','=','jl.journal_entry_id')
   ->where('j.company_id',$co)->where('j.status','posted')->groupBy('jl.account_id')
   ->select('jl.account_id')->selectRaw('SUM(jl.debit - jl.credit) as ledger_balance');
  return response()->json(['data'=>[
   'accounts'=>DB::table('bank_accounts as b')->join('chart_of_accounts as a','a.id','=','b.coa_id')
    ->leftJoinSub($balances,'bl','bl.account_id','=','b.coa_id')
    ->where('b.company_id',$co)->orderBy('b.name')->get(['b.*','a.code as coa_code','bl.ledger_balance']),
   'lines'=>DB::table('bank_statement_lines as l')->join('bank_accounts as b','b.id','=','l.bank_account_id')
    ->where('l.company_id',$co)->orderByDesc('l.value_date')->limit(250)->get(['l.*','b.name as account_name']),
   'unmatched_count'=>DB::table('bank_statement_lines')->where('company_id',$co)->whereNull('journal_line_id')->count()
  ]]);
 }
 public function account(Request $r){$this->canEdit($r);$co=$r->user()->company_id;
  $d=$r->validate(['coa_id'=>['required','ulid',Rule::exists('chart_of_accounts','id')->where('company_id',$co)],
   'name'=>['required','string','max:150'],'account_number'=>['nullable','string','max:100'],'currency'=>['nullable','string','size:3']]);
  abort_unless(DB::table('chart_of_accounts')->where('company_id',$co)->where('id',$d['coa_id'])->where('type','asset')->exists(),422,'Bank harus menggunakan akun aset.');
  return DB::transaction(function()use($r,$co,$d){$id=(string)Str::ulid();$now=now();
   DB::table('bank_accounts')->insert($d+['id'=>$id,'company_id'=>$co,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'bank_account.created','bank_account',$id);
   return response()->json(['data'=>DB::table('bank_accounts')->find($id)],201);
  });
 }
 public function statement(Request $r,string $id){$this->canEdit($r);$co=$r->user()->company_id;
  abort_unless(DB::table('bank_accounts')->where('company_id',$co)->where('id',$id)->exists(),404);
  $d=$r->validate(['reference'=>['required','string','max:120'],'value_date'=>['required','date'],
   'description'=>['nullable','string','max:1000'],'amount'=>['required','regex:/^-?\d{1,12}(?:\.\d{1,2})?$/']]);
  abort_unless(D::parse(ltrim($d['amount'],'-'))>0,422,'Nilai tidak boleh nol.');
  return DB::transaction(function()use($r,$id,$co,$d){$q=DB::table('bank_statement_lines')->where('bank_account_id',$id)->where('reference',$d['reference']);
   if($existing=$q->first()){
    abort_unless($existing->amount===$d['amount'] || (float)$existing->amount===(float)$d['amount'],409,'Referensi sudah digunakan untuk nilai berbeda.');
    return response()->json(['data'=>$existing,'already_exists'=>true]);
   }
   $ulid=(string)Str::ulid();$now=now();DB::table('bank_statement_lines')->insert($d+['id'=>$ulid,'company_id'=>$co,'bank_account_id'=>$id,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'bank.statement.imported','bank_statement_line',$ulid);
   return response()->json(['data'=>DB::table('bank_statement_lines')->find($ulid)],201);
  });
 }
 public function match(Request $r,string $id){$this->canEdit($r);$co=$r->user()->company_id;
  $d=$r->validate(['journal_line_id'=>['required','ulid']]);
  return DB::transaction(function()use($r,$co,$id,$d){
   $stmt=DB::table('bank_statement_lines')->where('company_id',$co)->where('id',$id)->lockForUpdate()->first();abort_unless($stmt,404);
   if($stmt->journal_line_id){abort_unless($stmt->journal_line_id===$d['journal_line_id'],409,'Mutasi bank sudah direkonsiliasi.');return response()->json(['data'=>$stmt,'already_exists'=>true]);}
   $bank=DB::table('bank_accounts')->where('company_id',$co)->where('id',$stmt->bank_account_id)->first();abort_unless($bank,404);
   $journal=DB::table('journal_lines as l')->join('journal_entries as e','e.id','=','l.journal_entry_id')
    ->where('l.id',$d['journal_line_id'])->where('e.company_id',$co)->where('e.status','posted')->where('l.account_id',$bank->coa_id)
    ->select('l.*','e.posting_date')->first();abort_unless($journal,422,'Baris jurnal harus posted dan memakai akun bank ini.');
   $bankValue=str_starts_with((string)$stmt->amount,'-')?-D::parse(substr((string)$stmt->amount,1)):D::parse((string)$stmt->amount);
   $journalValue=D::parse((string)$journal->debit)-D::parse((string)$journal->credit);
   abort_unless($bankValue===$journalValue,422,'Nilai bank tidak cocok dengan debit/kredit jurnal.');
   abort_if(DB::table('bank_statement_lines')->where('journal_line_id',$journal->id)->exists(),409,'Baris jurnal sudah dicocokkan.');
   DB::table('bank_statement_lines')->where('id',$id)->update(['journal_line_id'=>$journal->id,'matched_by'=>$r->user()->id,'matched_at'=>now(),'updated_at'=>now()]);
   AuditService::record($r->user(),'bank.statement.matched','bank_statement_line',$id,null,['journal_line_id'=>$journal->id]);
   return response()->json(['data'=>DB::table('bank_statement_lines')->find($id)]);
  });
 }
 public function unmatch(Request $r,string $id){$this->canEdit($r);$co=$r->user()->company_id;
  return DB::transaction(function()use($r,$co,$id){$s=DB::table('bank_statement_lines')->where('company_id',$co)->where('id',$id)->lockForUpdate()->first();abort_unless($s,404);
   DB::table('bank_statement_lines')->where('id',$id)->update(['journal_line_id'=>null,'matched_by'=>null,'matched_at'=>null,'updated_at'=>now()]);
   AuditService::record($r->user(),'bank.statement.unmatched','bank_statement_line',$id,['journal_line_id'=>$s->journal_line_id]);
   return response()->json(['data'=>DB::table('bank_statement_lines')->find($id)]);
  });
 }
}
