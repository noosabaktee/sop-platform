<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
class ReportController extends Controller {
 private function data(Request $r):array {
  $d=$r->validate(['type'=>['required',Rule::in(['sales','projects','inventory','purchase','finance'])],
   'from'=>['nullable','date'],'to'=>['nullable','date','after_or_equal:from']]);
  $allowed=['super_admin','admin','manager'];
  $domainRole=match($d['type']){
   'finance'=>'finance','sales'=>'sales','projects'=>'project_manager',
   'inventory'=>'warehouse','purchase'=>'procurement'
  };
  abort_unless(in_array($r->user()->role,[...$allowed,$domainRole],true),403);
  $co=$r->user()->company_id;$from=$d['from']??null;$to=$d['to']??null;
  $base=match($d['type']){
   'sales'=>DB::table('invoices as i')->join('customers as c','c.id','=','i.customer_id')->where('i.company_id',$co)
    ->when($from,fn($q)=>$q->whereDate('i.created_at','>=',$from))->when($to,fn($q)=>$q->whereDate('i.created_at','<=',$to))
    ->select('i.number','c.name as customer','i.amount','i.paid_amount','i.status','i.due_date'),
   'projects'=>DB::table('projects as p')->join('customers as c','c.id','=','p.customer_id')->where('p.company_id',$co)
    ->select('p.code','p.name','c.name as customer','p.contract_value','p.budget','p.status'),
   'inventory'=>DB::table('inventory_movements as m')->join('products as p','p.id','=','m.product_id')
    ->where('m.company_id',$co)->when($from,fn($q)=>$q->whereDate('m.posted_at','>=',$from))->when($to,fn($q)=>$q->whereDate('m.posted_at','<=',$to))
    ->select('m.reference','p.sku','p.name as product','m.quantity','m.unit_cost','m.movement_type','m.posted_at'),
   'purchase'=>DB::table('purchase_orders as p')->join('vendors as v','v.id','=','p.vendor_id')->where('p.company_id',$co)
    ->select('p.number','v.name as vendor','p.total','p.status','p.created_at'),
   'finance'=>DB::table('journal_entries as j')->where('j.company_id',$co)
    ->when($from,fn($q)=>$q->whereDate('j.posting_date','>=',$from))->when($to,fn($q)=>$q->whereDate('j.posting_date','<=',$to))
    ->select('j.number','j.posting_date','j.description','j.status'),
  };
  return ['type'=>$d['type'],'rows'=>$base->limit(2000)->get()->map(fn($row)=>(array)$row)->all(),'generated_at'=>now()->toIso8601String()];
 }
 public function index(Request $r){return response()->json(['data'=>$this->data($r)]);}
 public function csv(Request $r){$report=$this->data($r);$headers=array_keys($report['rows'][0]??['message'=>'no rows']);
  return response()->streamDownload(function()use($report,$headers){$out=fopen('php://output','w');fwrite($out,"\xEF\xBB\xBF");fputcsv($out,$headers);
   foreach($report['rows'] as $row){fputcsv($out,array_map(static function($v){$s=(string)($v??'');
    // prevent CSV formula injection when opened in spreadsheet software
    return preg_match('/^\s*[=+@\-\t\r]/u',$s)?"'".$s:$s;
   },array_values($row)));}fclose($out);
  },'sop-'.$report['type'].'-'.date('Ymd').'.csv',['Content-Type'=>'text/csv; charset=UTF-8']);
 }
}
