<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as Dec;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InventoryOperationsController extends Controller {
 public function index(Request $r){
  $company=$r->user()->company_id;
  $balances=DB::table('inventory_movements as m')
   ->join('products as p','p.id','=','m.product_id')->join('warehouses as w','w.id','=','m.warehouse_id')
   ->where('m.company_id',$company)->groupBy('m.product_id','m.warehouse_id','p.sku','p.name','p.unit','w.code','w.name')
   ->select('m.product_id','m.warehouse_id','p.sku','p.name as product','p.unit','w.code as warehouse_code','w.name as warehouse')
   ->selectRaw('SUM(m.quantity) as quantity')->selectRaw('SUM(m.quantity * m.unit_cost) as movement_cost')
   ->orderBy('p.sku')->get();
  $batches=DB::table('inventory_movements as m')
   ->join('products as p','p.id','=','m.product_id')->join('warehouses as w','w.id','=','m.warehouse_id')
   ->where('m.company_id',$company)->whereNotNull('m.batch_number')
   ->groupBy('m.product_id','m.warehouse_id','m.batch_number','p.sku','p.name','p.unit','w.code','w.name')
   ->select('m.product_id','m.warehouse_id','m.batch_number','p.sku','p.name as product','p.unit','w.code as warehouse_code','w.name as warehouse')
   ->selectRaw('MAX(m.expiry_date) as expiry_date')
   ->selectRaw('SUM(m.quantity) as quantity')
   ->havingRaw('SUM(m.quantity) > 0')
   ->orderByRaw('MAX(m.expiry_date) ASC NULLS LAST')->orderBy('m.batch_number')->get();
  $movements=DB::table('inventory_movements as m')->join('products as p','p.id','=','m.product_id')
   ->join('warehouses as w','w.id','=','m.warehouse_id')->where('m.company_id',$company)->orderByDesc('m.posted_at')->limit(200)
   ->get(['m.id','p.sku','p.name as product','w.name as warehouse','m.quantity','m.unit_cost','m.movement_type','m.reference','m.batch_number','m.serial_number','m.expiry_date','m.posted_at']);
  return response()->json(['data'=>['balances'=>$balances,'batches'=>$batches,'movements'=>$movements,'generated_at'=>now()->toIso8601String()]]);
 }
 public function batches(Request $r){
  $company=$r->user()->company_id;
  $query=DB::table('inventory_movements as m')
   ->join('products as p','p.id','=','m.product_id')->join('warehouses as w','w.id','=','m.warehouse_id')
   ->where('m.company_id',$company)->whereNotNull('m.batch_number');
  if($r->filled('product_id'))$query->where('m.product_id',$r->query('product_id'));
  if($r->filled('warehouse_id'))$query->where('m.warehouse_id',$r->query('warehouse_id'));
  $batches=$query->groupBy('m.product_id','m.warehouse_id','m.batch_number','p.sku','p.name','p.unit','w.code','w.name')
   ->select('m.product_id','m.warehouse_id','m.batch_number','p.sku','p.name as product','p.unit','w.code as warehouse_code','w.name as warehouse')
   ->selectRaw('MAX(m.expiry_date) as expiry_date')
   ->selectRaw('SUM(m.quantity) as quantity')
   ->havingRaw('SUM(m.quantity) > 0')
   ->orderByRaw('MAX(m.expiry_date) ASC NULLS LAST')->orderBy('m.batch_number')->get();
  return response()->json(['data'=>$batches]);
 }
 public function adjust(Request $r){
  abort_unless(in_array($r->user()->role,['super_admin','admin','manager','warehouse'],true),403);
  $co=$r->user()->company_id;
  $data=$r->validate([
   'product_id'=>['required','ulid',Rule::exists('products','id')->where('company_id',$co)],
   'warehouse_id'=>['required','ulid',Rule::exists('warehouses','id')->where('company_id',$co)],
   'quantity'=>['required','regex:/^-?\d{1,12}(?:\.\d{1,4})?$/'],
   'reason'=>['required','string','min:6','max:500'],
   'batch_number'=>['nullable','string','max:100'],
   'serial_number'=>['nullable','string','max:100'],
   'expiry_date'=>['nullable','date'],
   'idempotency_key'=>['required','string','min:8','max:100']]);
  return DB::transaction(function()use($r,$co,$data){
   $existing=DB::table('inventory_movements')->where('company_id',$co)->where('idempotency_key',$data['idempotency_key'])->first();
   if($existing)return response()->json(['data'=>$existing,'already_exists'=>true]);
   $product=DB::table('products')->where('company_id',$co)->where('id',$data['product_id'])->lockForUpdate()->first();abort_unless($product,404);
   $q=Dec::parse(ltrim($data['quantity'],'-'),4)*($data['quantity'][0]==='-'?-1:1);
   abort_unless($q!==0,422,'Quantity tidak boleh nol.');
   $balQuery=DB::table('inventory_movements')->where('company_id',$co)->where('product_id',$data['product_id'])->where('warehouse_id',$data['warehouse_id']);
   if(!empty($data['batch_number']))$balQuery->where('batch_number',$data['batch_number']);
   $bal=$balQuery->sum('quantity');
   abort_unless(Dec::parse((string)$bal,4)+$q>=0,422,'Stok tidak cukup.');
   $id=(string)Str::ulid();$now=now();
   DB::table('inventory_movements')->insert(['id'=>$id,'company_id'=>$co,'product_id'=>$data['product_id'],
    'warehouse_id'=>$data['warehouse_id'],'actor_id'=>$r->user()->id,'quantity'=>Dec::format($q,4),
    'unit_cost'=>$product->standard_cost,'movement_type'=>'manual_adjustment','reference'=>$data['reason'],
    'batch_number'=>$data['batch_number']??null,'serial_number'=>$data['serial_number']??null,'expiry_date'=>$data['expiry_date']??null,
    'idempotency_key'=>$data['idempotency_key'],'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'inventory.adjusted','inventory_movement',$id,null,['quantity'=>Dec::format($q,4),'reason'=>$data['reason'],'batch_number'=>$data['batch_number']??null]);
   return response()->json(['data'=>DB::table('inventory_movements')->find($id)],201);
  });
 }
}
