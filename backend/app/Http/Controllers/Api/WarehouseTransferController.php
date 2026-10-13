<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as Dec;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Immutable stock-ledger transfer: draft -> in_transit -> received. */
class WarehouseTransferController extends Controller {
 private function co(Request $request): string { return (string)$request->user()->company_id; }
 private function authorizeWrite(Request $request): void {
  abort_unless(in_array($request->user()->role,['super_admin','admin','manager','warehouse'],true),403);
 }
 private function findLocked(Request $request,string $id): object {
  $transfer=DB::table('warehouse_transfers')->where('company_id',$this->co($request))
   ->where('id',$id)->lockForUpdate()->first();abort_unless($transfer,404);return $transfer;
 }
 public function index(Request $request) {
  $company=$this->co($request);
  $rows=DB::table('warehouse_transfers as t')
   ->join('products as p','p.id','=','t.product_id')
   ->join('warehouses as w1','w1.id','=','t.from_warehouse_id')
   ->join('warehouses as w2','w2.id','=','t.to_warehouse_id')
   ->where('t.company_id',$company)->orderByDesc('t.created_at')->limit(250)
   ->get(['t.id','t.number','t.product_id','p.name as product','p.sku','w1.name as from_warehouse',
    'w2.name as to_warehouse','t.from_warehouse_id','t.to_warehouse_id','t.quantity',
    't.status','t.created_at','t.shipped_at','t.received_at']);
  return response()->json(['data'=>$rows]);
 }
 public function create(Request $request) {
  $this->authorizeWrite($request);$company=$this->co($request);
  $input=$request->validate([
   'product_id'=>['required','ulid',Rule::exists('products','id')->where('company_id',$company)],
   'from_warehouse_id'=>['required','ulid',Rule::exists('warehouses','id')->where('company_id',$company)],
   'to_warehouse_id'=>['required','ulid','different:from_warehouse_id',Rule::exists('warehouses','id')->where('company_id',$company)],
   'quantity'=>['required','numeric','gt:0','decimal:0,4'],
   'idempotency_key'=>['required','string','min:8','max:100'],
   'note'=>['nullable','string','max:1000']]);
  return DB::transaction(function()use($request,$input,$company){
   $already=DB::table('warehouse_transfers')->where('company_id',$company)
    ->where('idempotency_key',$input['idempotency_key'])->first();
   if($already){
    $matches=$already->product_id===$input['product_id']
     && $already->from_warehouse_id===$input['from_warehouse_id']
     && $already->to_warehouse_id===$input['to_warehouse_id']
     && Dec::parse((string)$already->quantity,4)===Dec::parse((string)$input['quantity'],4);
    abort_unless($matches,409,'Idempotency key sudah dipakai untuk transfer lain.');
    return response()->json(['data'=>$already,'already_exists'=>true]);
   }
   $p=DB::table('products')->where('company_id',$company)->where('id',$input['product_id'])->first();
   abort_unless($p && $p->is_active,422,'Produk harus aktif.');
   $active=DB::table('warehouses')->where('company_id',$company)
    ->whereIn('id',[$input['from_warehouse_id'],$input['to_warehouse_id']])->where('is_active',true)->count();
   abort_unless($active===2,422,'Kedua gudang harus aktif.');
   $quantity=Dec::parse((string)$input['quantity'],4);
   $id=(string)Str::ulid();$now=now();
   DB::table('warehouse_transfers')->insert([
    'id'=>$id,'company_id'=>$company,'product_id'=>$p->id,
    'from_warehouse_id'=>$input['from_warehouse_id'],'to_warehouse_id'=>$input['to_warehouse_id'],
    'requested_by'=>$request->user()->id,'number'=>'WT-'.strtoupper((string)Str::ulid()),
    'idempotency_key'=>$input['idempotency_key'],'quantity'=>Dec::format($quantity,4),
    'unit_cost'=>$p->standard_cost,'status'=>'draft','note'=>$input['note']??null,
    'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($request->user(),'warehouse_transfer.created','warehouse_transfer',$id,null,['quantity'=>Dec::format($quantity,4)]);
   return response()->json(['data'=>DB::table('warehouse_transfers')->find($id)],201);
  });
 }
 public function ship(Request $request,string $id) {
  $this->authorizeWrite($request);
  return DB::transaction(function()use($request,$id){
   $transfer=$this->findLocked($request,$id);
   if(in_array($transfer->status,['in_transit','received'],true))return response()->json(['data'=>$transfer,'already_processed'=>true]);
   abort_unless($transfer->status==='draft',409,'Hanya transfer draft yang bisa dikirim.');
   // Product lock also serializes transfers with stock adjustments and other transfers.
   DB::table('products')->where('company_id',$this->co($request))->where('id',$transfer->product_id)->lockForUpdate()->first();
   $balance=DB::table('inventory_movements')->where('company_id',$this->co($request))
    ->where('product_id',$transfer->product_id)->where('warehouse_id',$transfer->from_warehouse_id)->sum('quantity');
   $available=Dec::parse(ltrim((string)$balance,'-'),4)*(str_starts_with((string)$balance,'-')?-1:1);
   $qty=Dec::parse((string)$transfer->quantity,4);
   abort_unless($available>=$qty,422,'Stok gudang asal tidak mencukupi.');
   $now=now();DB::table('inventory_movements')->insert([
    'id'=>(string)Str::ulid(),'company_id'=>$this->co($request),'product_id'=>$transfer->product_id,
    'warehouse_id'=>$transfer->from_warehouse_id,'actor_id'=>$request->user()->id,
    'quantity'=>Dec::format(-$qty,4),'unit_cost'=>$transfer->unit_cost,
    'movement_type'=>'transfer_out','reference'=>$transfer->number,
    'source_type'=>'warehouse_transfer_out','source_id'=>$id,
    'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
   DB::table('warehouse_transfers')->where('id',$id)->update(['status'=>'in_transit',
    'shipped_by'=>$request->user()->id,'shipped_at'=>$now,'updated_at'=>$now]);
   AuditService::record($request->user(),'warehouse_transfer.shipped','warehouse_transfer',$id,['status'=>'draft'],['status'=>'in_transit']);
   return response()->json(['data'=>DB::table('warehouse_transfers')->find($id)]);
  });
 }
 public function receive(Request $request,string $id) {
  $this->authorizeWrite($request);
  return DB::transaction(function()use($request,$id){
   $transfer=$this->findLocked($request,$id);
   if($transfer->status==='received')return response()->json(['data'=>$transfer,'already_processed'=>true]);
   abort_unless($transfer->status==='in_transit',409,'Transfer belum dikirim dari gudang asal.');
   $now=now();DB::table('inventory_movements')->insert([
    'id'=>(string)Str::ulid(),'company_id'=>$this->co($request),'product_id'=>$transfer->product_id,
    'warehouse_id'=>$transfer->to_warehouse_id,'actor_id'=>$request->user()->id,
    'quantity'=>$transfer->quantity,'unit_cost'=>$transfer->unit_cost,
    'movement_type'=>'transfer_in','reference'=>$transfer->number,
    'source_type'=>'warehouse_transfer_in','source_id'=>$id,
    'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
   DB::table('warehouse_transfers')->where('id',$id)->update(['status'=>'received',
    'received_by'=>$request->user()->id,'received_at'=>$now,'updated_at'=>$now]);
   AuditService::record($request->user(),'warehouse_transfer.received','warehouse_transfer',$id,['status'=>'in_transit'],['status'=>'received']);
   return response()->json(['data'=>DB::table('warehouse_transfers')->find($id)]);
  });
 }
 public function cancel(Request $request,string $id) {
  $this->authorizeWrite($request);
  return DB::transaction(function()use($request,$id){
   $transfer=$this->findLocked($request,$id);
   if($transfer->status==='cancelled')return response()->json(['data'=>$transfer,'already_processed'=>true]);
   abort_unless($transfer->status==='draft',409,'Transfer yang sudah dikirim tidak dapat dibatalkan.');
   DB::table('warehouse_transfers')->where('id',$id)->update(['status'=>'cancelled','updated_at'=>now()]);
   AuditService::record($request->user(),'warehouse_transfer.cancelled','warehouse_transfer',$id,['status'=>'draft'],['status'=>'cancelled']);
   return response()->json(['data'=>DB::table('warehouse_transfers')->find($id)]);
  });
 }
}
