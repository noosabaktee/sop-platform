<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as Dec;
use App\Services\JournalPostingService;
use App\Services\OperationalNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** PR -> approved PR -> PO -> partial/full GR -> return/stock movement. */
class ProcurementWorkflowController extends Controller {
 private function company(Request $r):string{return (string)$r->user()->company_id;}
 private function assertRole(Request $r,array $roles=['super_admin','admin','manager','procurement']):void {
  abort_unless(in_array($r->user()->role,$roles,true),403);
 }
 private function record(Request $r,string $table,string $id):object{
  $value=DB::table($table)->where('company_id',$this->company($r))->where('id',$id)->lockForUpdate()->first();
  abort_unless($value,404);return $value;
 }
 private function code(string $prefix):string{return $prefix.'-'.date('Y').'-'.strtoupper((string)Str::ulid());}
 private function productRules(Request $r):array{
  return ['lines'=>['required','array','min:1','max:100'],
   'lines.*.product_id'=>['required','ulid',Rule::exists('products','id')->where('company_id',$this->company($r))],
   'lines.*.quantity'=>['required','numeric','gt:0','decimal:0,4'],
   'lines.*.unit_price'=>['required','numeric','min:0','decimal:0,2']];
 }
 public function options(Request $r){$co=$this->company($r);
  return response()->json(['data'=>[
   'vendors'=>DB::table('vendors')->where('company_id',$co)->where('status','active')->get(['id','code','name']),
   'warehouses'=>DB::table('warehouses')->where('company_id',$co)->where('is_active',true)->get(['id','code','name']),
   'products'=>DB::table('products')->where('company_id',$co)->where('is_active',true)->get(['id','sku','name','standard_cost']),
   'projects'=>DB::table('projects')->where('company_id',$co)->get(['id','code','name'])]]);
 }
 public function index(Request $r){$co=$this->company($r);
  return response()->json(['data'=>[
   'requests'=>DB::table('purchase_requests as pr')
    ->join('users as u','u.id','=','pr.requester_id')
    ->leftJoin('projects as p','p.id','=','pr.project_id')
    ->where('pr.company_id',$co)->orderByDesc('pr.created_at')->limit(200)
    ->get(['pr.*','u.name as requester','p.name as project']),
   'orders'=>DB::table('purchase_orders as po')->join('vendors as v','v.id','=','po.vendor_id')->where('po.company_id',$co)
    ->orderByDesc('po.created_at')->limit(200)->get(['po.*','v.name as vendor']),
   'receipts'=>DB::table('goods_receipts as gr')->join('purchase_orders as po','po.id','=','gr.purchase_order_id')
    ->join('vendors as v','v.id','=','po.vendor_id')
    ->join('warehouses as w','w.id','=','gr.warehouse_id')
    ->where('gr.company_id',$co)->orderByDesc('gr.created_at')->limit(200)
    ->get(['gr.*','po.number as purchase_order_number','v.name as vendor','w.name as warehouse']),
   'returns'=>DB::table('purchase_returns as ret')
    ->join('goods_receipt_lines as l','l.id','=','ret.goods_receipt_line_id')
    ->join('goods_receipts as gr','gr.id','=','l.goods_receipt_id')
    ->join('purchase_orders as po','po.id','=','gr.purchase_order_id')
    ->join('vendors as v','v.id','=','po.vendor_id')
    ->where('ret.company_id',$co)->orderByDesc('ret.created_at')->limit(200)
    ->get(['ret.*','gr.number as goods_receipt_number','v.name as vendor','l.unit_cost'])]]);
 }
 public function createRequest(Request $r){
  $data=$r->validate(array_merge($this->productRules($r),[
   'project_id'=>['nullable','ulid',Rule::exists('projects','id')->where('company_id',$this->company($r))]]));
  return DB::transaction(function()use($r,$data){
   $total=0;$lines=[];foreach($data['lines'] as $item){
    $amount=Dec::line((string)$item['quantity'],(string)$item['unit_price']);
    abort_if($total>PHP_INT_MAX-$amount,422,'Total PR terlalu besar.');$total+=$amount;
    $lines[]=['product_id'=>$item['product_id'],'quantity'=>Dec::format(Dec::parse((string)$item['quantity'],4),4),
       'unit_price'=>Dec::format(Dec::parse((string)$item['unit_price']))];
   }
   $id=(string)Str::ulid();$now=now();
   DB::table('purchase_requests')->insert(['id'=>$id,'company_id'=>$this->company($r),'requester_id'=>$r->user()->id,
    'project_id'=>$data['project_id']??null,'number'=>$this->code('PR'),'status'=>'draft','estimated_total'=>Dec::format($total),'created_at'=>$now,'updated_at'=>$now]);
   foreach($lines as $line)DB::table('purchase_request_lines')->insert(['id'=>(string)Str::ulid(),'purchase_request_id'=>$id]+$line+['created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'purchase_request.created','purchase_request',$id,null,['total'=>Dec::format($total)]);
   return response()->json(['data'=>DB::table('purchase_requests')->find($id)],201);
  });
 }
 public function submit(Request $r,string $id){
  return DB::transaction(function()use($r,$id){$pr=$this->record($r,'purchase_requests',$id);
   abort_unless($pr->requester_id===$r->user()->id || $r->user()->canManageRecords(),403);
   abort_unless($pr->status==='draft',409,'Hanya PR draft yang dapat disubmit.');
   abort_unless(DB::table('purchase_request_lines')->where('purchase_request_id',$id)->exists(),422,'PR harus memiliki item.');
   DB::table('purchase_requests')->where('id',$id)->update(['status'=>'pending_approval','updated_at'=>now()]);
   $approval=(string)Str::ulid();DB::table('transaction_approvals')->insert([
    'id'=>$approval,'company_id'=>$this->company($r),'subject_type'=>'purchase_request','subject_id'=>$id,
    'requester_id'=>$r->user()->id,'status'=>'pending','created_at'=>now(),'updated_at'=>now()]);
   app(OperationalNotification::class)->toApprovers($this->company($r),(string)$r->user()->id,
    'purchase_request.approval_requested',['subject_id'=>$id,'number'=>$pr->number]);
   AuditService::record($r->user(),'purchase_request.submitted','purchase_request',$id,['status'=>'draft'],['status'=>'pending_approval']);
   return response()->json(['data'=>['id'=>$id,'status'=>'pending_approval','approval_id'=>$approval]]);
  });
 }
 public function decide(Request $r,string $id){$this->assertRole($r,['super_admin','admin','manager']);
  $input=$r->validate(['decision'=>['required',Rule::in(['approved','rejected'])], 'reason'=>['nullable','string','max:1000']]);
  return DB::transaction(function()use($r,$id,$input){$pr=$this->record($r,'purchase_requests',$id);
   abort_unless($pr->status==='pending_approval',409,'PR tidak menunggu persetujuan.');
   abort_if($pr->requester_id===$r->user()->id && $r->user()->role!=='super_admin',403,'Self approval tidak diizinkan.');
   if($input['decision']==='rejected')abort_unless(trim($input['reason']??'')!=='',422,'Alasan penolakan wajib.');
   $a=DB::table('transaction_approvals')->where('company_id',$this->company($r))->where('subject_type','purchase_request')
    ->where('subject_id',$id)->where('status','pending')->lockForUpdate()->first();abort_unless($a,409);
   DB::table('transaction_approvals')->where('id',$a->id)->update(['status'=>$input['decision'],'comment'=>$input['reason']??null,
    'approver_id'=>$r->user()->id,'decided_at'=>now(),'updated_at'=>now()]);
   DB::table('purchase_requests')->where('id',$id)->update(['status'=>$input['decision'],'updated_at'=>now()]);
   app(OperationalNotification::class)->toUser((string)$pr->requester_id,'purchase_request.'.$input['decision'],
    ['subject_id'=>$id,'number'=>$pr->number]);
   AuditService::record($r->user(),'purchase_request.'.$input['decision'],'purchase_request',$id,['status'=>$pr->status],['status'=>$input['decision']]);
   return response()->json(['data'=>DB::table('purchase_requests')->find($id)]);
  });
 }
 public function createOrder(Request $r,string $id){$this->assertRole($r);
  $data=$r->validate(['vendor_id'=>['required','ulid',Rule::exists('vendors','id')->where('company_id',$this->company($r))]]);
  return DB::transaction(function()use($r,$id,$data){$pr=$this->record($r,'purchase_requests',$id);
   $existing=DB::table('purchase_orders')->where('company_id',$this->company($r))->where('purchase_request_id',$id)->first();
   if($existing)return response()->json(['data'=>$existing,'already_exists'=>true]);
   abort_unless($pr->status==='approved',409,'PR harus approved sebelum menjadi PO.');
   $items=DB::table('purchase_request_lines')->where('purchase_request_id',$id)->get();abort_unless($items->isNotEmpty(),422);
   $poId=(string)Str::ulid();$now=now();
   DB::table('purchase_orders')->insert(['id'=>$poId,'company_id'=>$this->company($r),'purchase_request_id'=>$id,
    'vendor_id'=>$data['vendor_id'],'number'=>$this->code('PO'),'status'=>'confirmed',
    'total'=>$pr->estimated_total,'created_at'=>$now,'updated_at'=>$now]);
   foreach($items as $item)DB::table('purchase_order_lines')->insert([
    'id'=>(string)Str::ulid(),'purchase_order_id'=>$poId,'product_id'=>$item->product_id,'quantity'=>$item->quantity,
    'received_quantity'=>'0.0000','unit_price'=>$item->unit_price,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'purchase_order.created','purchase_order',$poId,null,['purchase_request_id'=>$id]);
   return response()->json(['data'=>DB::table('purchase_orders')->find($poId)],201);
  });
 }
 public function receive(Request $r,string $id){$this->assertRole($r,['super_admin','admin','manager','procurement','warehouse']);
  $data=$r->validate(['warehouse_id'=>['required','ulid',Rule::exists('warehouses','id')->where('company_id',$this->company($r))],
   'received_at'=>['required','date','before_or_equal:today'],'reference'=>['required','string','min:8','max:120'],
   'lines'=>['required','array','min:1','max:100'],'lines.*.order_line_id'=>['required','ulid'],
   'lines.*.quantity'=>['required','numeric','gt:0','decimal:0,4']]);
  return DB::transaction(function()use($r,$id,$data){$po=$this->record($r,'purchase_orders',$id);
   $existing=DB::table('goods_receipts')->where('company_id',$this->company($r))->where('purchase_order_id',$id)->where('reference',$data['reference'])->first();
   if($existing)return response()->json(['data'=>$existing,'already_exists'=>true]);
   abort_unless(in_array($po->status,['confirmed','partial'],true),409,'PO belum dapat diterima.');
   $orderLines=DB::table('purchase_order_lines')->where('purchase_order_id',$id)->lockForUpdate()->get()->keyBy('id');
   $submitted=[];
   foreach($data['lines'] as $line){
    $key=$line['order_line_id'];abort_unless(isset($orderLines[$key]),422,'Baris PO tidak valid.');
    abort_if(isset($submitted[$key]),422,'Duplikat baris penerimaan.');$submitted[$key]=true;
    $n=Dec::parse((string)$line['quantity'],4);$ol=$orderLines[$key];
    abort_unless($n>0 && $n<=Dec::parse((string)$ol->quantity,4)-Dec::parse((string)$ol->received_quantity,4),422,'Jumlah diterima melebihi sisa PO.');
   }
   $now=now();$grId=(string)Str::ulid();
   DB::table('goods_receipts')->insert(['id'=>$grId,'company_id'=>$this->company($r),'purchase_order_id'=>$id,
    'warehouse_id'=>$data['warehouse_id'],'received_by'=>$r->user()->id,'number'=>$this->code('GR'),
    'reference'=>$data['reference'],'received_at'=>$data['received_at'],'created_at'=>$now,'updated_at'=>$now]);
   foreach($data['lines'] as $line){$ol=$orderLines[$line['order_line_id']];$qty=Dec::parse((string)$line['quantity'],4);
    $glId=(string)Str::ulid();$formatted=Dec::format($qty,4);
    DB::table('goods_receipt_lines')->insert(['id'=>$glId,'goods_receipt_id'=>$grId,'purchase_order_line_id'=>$ol->id,
     'product_id'=>$ol->product_id,'quantity'=>$formatted,'unit_cost'=>$ol->unit_price,'created_at'=>$now,'updated_at'=>$now]);
    DB::table('inventory_movements')->insert(['id'=>(string)Str::ulid(),'company_id'=>$this->company($r),
     'product_id'=>$ol->product_id,'warehouse_id'=>$data['warehouse_id'],'actor_id'=>$r->user()->id,
     'quantity'=>$formatted,'unit_cost'=>$ol->unit_price,'movement_type'=>'goods_receipt',
     'reference'=>$data['reference'],'source_type'=>'goods_receipt_line','source_id'=>$glId,
     'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
    $lineAmount=Dec::line($formatted,(string)$ol->unit_price);
    if($lineAmount>0)app(JournalPostingService::class)->post($this->company($r),'goods_receipt_line',$glId,
     'Penerimaan barang PO '.$po->number,'1300','2200',Dec::format($lineAmount),$data['received_at']);
    DB::table('purchase_order_lines')->where('id',$ol->id)->update(['received_quantity'=>Dec::format(Dec::parse((string)$ol->received_quantity,4)+$qty,4),'updated_at'=>$now]);
   }
   $outstanding=DB::table('purchase_order_lines')->where('purchase_order_id',$id)
    ->whereColumn('received_quantity','<','quantity')->exists();
   DB::table('purchase_orders')->where('id',$id)->update(['status'=>$outstanding?'partial':'received','updated_at'=>$now]);
   AuditService::record($r->user(),'goods_receipt.posted','goods_receipt',$grId,null,['purchase_order_id'=>$id,'reference'=>$data['reference']]);
   return response()->json(['data'=>DB::table('goods_receipts')->find($grId)],201);
  });
 }
 public function returnGoods(Request $r,string $receiptId){$this->assertRole($r,['super_admin','admin','manager','procurement','warehouse']);
  $data=$r->validate(['receipt_line_id'=>['required','ulid'],'quantity'=>['required','numeric','gt:0','decimal:0,4'],
   'reason'=>['required','string','min:4','max:500']]);
  return DB::transaction(function()use($r,$receiptId,$data){$receipt=$this->record($r,'goods_receipts',$receiptId);
   $line=DB::table('goods_receipt_lines')->where('goods_receipt_id',$receiptId)->where('id',$data['receipt_line_id'])->lockForUpdate()->first();
   abort_unless($line,422,'Baris receipt tidak cocok.');
   // Lock product to serialize competing returns and manual stock adjustments.
   DB::table('products')->where('company_id',$this->company($r))->where('id',$line->product_id)->lockForUpdate()->first();
   $past=DB::table('purchase_returns')->where('company_id',$this->company($r))->where('goods_receipt_line_id',$line->id)->sum('quantity');
   $qty=Dec::parse((string)$data['quantity'],4);
   abort_unless($qty<=Dec::parse((string)$line->quantity,4)-Dec::parse((string)$past,4),422,'Return melebihi barang diterima.');
   $balance=DB::table('inventory_movements')->where('company_id',$this->company($r))->where('product_id',$line->product_id)
    ->where('warehouse_id',$receipt->warehouse_id)->sum('quantity');
   abort_unless(Dec::parse((string)$balance,4)>=$qty,422,'Stok aktual tidak cukup untuk return.');
   $id=(string)Str::ulid();$now=now();
   DB::table('purchase_returns')->insert(['id'=>$id,'company_id'=>$this->company($r),'goods_receipt_line_id'=>$line->id,
    'actor_id'=>$r->user()->id,'quantity'=>Dec::format($qty,4),'reason'=>$data['reason'],'created_at'=>$now,'updated_at'=>$now]);
   DB::table('inventory_movements')->insert(['id'=>(string)Str::ulid(),'company_id'=>$this->company($r),
    'product_id'=>$line->product_id,'warehouse_id'=>$receipt->warehouse_id,'actor_id'=>$r->user()->id,
    'quantity'=>Dec::format(-$qty,4),'unit_cost'=>$line->unit_cost,'movement_type'=>'purchase_return',
    'reference'=>$receipt->number,'source_type'=>'purchase_return','source_id'=>$id,
    'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
   $returnAmount=Dec::line(Dec::format($qty,4),(string)$line->unit_cost);
   if($returnAmount>0)app(JournalPostingService::class)->post($this->company($r),'purchase_return',$id,
    'Retur penerimaan '.$receipt->number,'2200','1300',Dec::format($returnAmount),now()->toDateString());
   AuditService::record($r->user(),'goods_receipt.returned','purchase_return',$id,null,['goods_receipt_id'=>$receiptId,'quantity'=>Dec::format($qty,4)]);
   return response()->json(['data'=>DB::table('purchase_returns')->find($id)],201);
  });
 }
}
