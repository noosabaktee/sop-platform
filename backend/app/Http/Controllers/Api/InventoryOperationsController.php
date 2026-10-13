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
  $movements=DB::table('inventory_movements as m')->join('products as p','p.id','=','m.product_id')
   ->join('warehouses as w','w.id','=','m.warehouse_id')->where('m.company_id',$company)->orderByDesc('m.posted_at')->limit(200)
   ->get(['m.id','p.sku','p.name as product','w.name as warehouse','m.quantity','m.unit_cost','m.movement_type','m.reference','m.posted_at']);
  return response()->json(['data'=>['balances'=>$balances,'movements'=>$movements,'generated_at'=>now()->toIso8601String()]]);
 }
 public function adjust(Request $r){
  abort_unless(in_array($r->user()->role,['super_admin','admin','manager','warehouse'],true),403);
  $co=$r->user()->company_id;
  $data=$r->validate([
   'product_id'=>['required','ulid',Rule::exists('products','id')->where('company_id',$co)],
   'warehouse_id'=>['required','ulid',Rule::exists('warehouses','id')->where('company_id',$co)],
   'quantity'=>['required','regex:/^-?\d{1,12}(?:\.\d{1,4})?$/'],
   'reason'=>['required','string','min:6','max:500'],
   'idempotency_key'=>['required','string','min:8','max:100']]);
  return DB::transaction(function()use($r,$co,$data){
   $existing=DB::table('inventory_movements')->where('company_id',$co)->where('idempotency_key',$data['idempotency_key'])->first();
   if($existing)return response()->json(['data'=>$existing,'already_exists'=>true]);
   $product=DB::table('products')->where('company_id',$co)->where('id',$data['product_id'])->lockForUpdate()->first();abort_unless($product,404);
   $q=Dec::parse(ltrim($data['quantity'],'-'),4)*($data['quantity'][0]==='-'?-1:1);
   abort_unless($q!==0,422,'Quantity tidak boleh nol.');
   $bal=DB::table('inventory_movements')->where('company_id',$co)->where('product_id',$data['product_id'])->where('warehouse_id',$data['warehouse_id'])->sum('quantity');
   abort_unless(Dec::parse((string)$bal,4)+$q>=0,422,'Stok tidak cukup.');
   $id=(string)Str::ulid();$now=now();
   DB::table('inventory_movements')->insert(['id'=>$id,'company_id'=>$co,'product_id'=>$data['product_id'],
    'warehouse_id'=>$data['warehouse_id'],'actor_id'=>$r->user()->id,'quantity'=>Dec::format($q,4),
    'unit_cost'=>$product->standard_cost,'movement_type'=>'manual_adjustment','reference'=>$data['reason'],
    'idempotency_key'=>$data['idempotency_key'],'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'inventory.adjusted','inventory_movement',$id,null,['quantity'=>Dec::format($q,4),'reason'=>$data['reason']]);
   return response()->json(['data'=>DB::table('inventory_movements')->find($id)],201);
  });
 }
}
