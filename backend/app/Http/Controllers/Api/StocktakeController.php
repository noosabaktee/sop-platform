<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\JournalPostingService;
use App\Services\ExactDecimal as D;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Count against an immutable inventory snapshot. No mutation of old ledger rows. */
class StocktakeController extends Controller {
 private function guard(Request $r):void {abort_unless(in_array($r->user()->role,['super_admin','admin','manager','warehouse'],true),403);}
 private function stocktake(Request $r,string $id,bool $lock=false):object {
  $q=DB::table('stocktakes')->where('company_id',$r->user()->company_id)->where('id',$id);
  $row=($lock?$q->lockForUpdate():$q)->first();abort_unless($row,404);return $row;
 }
 public function index(Request $r){$co=$r->user()->company_id;
  return response()->json(['data'=>DB::table('stocktakes as s')->join('warehouses as w','w.id','=','s.warehouse_id')
   ->where('s.company_id',$co)->orderByDesc('s.created_at')->limit(100)->get(['s.*','w.name as warehouse'])]);
 }
 public function show(Request $r,string $id){$s=$this->stocktake($r,$id);
  return response()->json(['data'=>['stocktake'=>$s,'lines'=>DB::table('stocktake_lines as l')
   ->join('products as p','p.id','=','l.product_id')->where('l.stocktake_id',$s->id)->orderBy('p.sku')
   ->get(['l.*','p.name as product','p.sku'])]]);
 }
 public function create(Request $r){$this->guard($r);$co=$r->user()->company_id;
  $d=$r->validate(['warehouse_id'=>['required','ulid',Rule::exists('warehouses','id')->where('company_id',$co)],'note'=>['nullable','string','max:1000']]);
  return DB::transaction(function()use($r,$co,$d){
   abort_if(DB::table('stocktakes')->where('company_id',$co)->where('warehouse_id',$d['warehouse_id'])->where('status','counting')->lockForUpdate()->exists(),409,'Selesaikan stock opname yang masih berjalan.');
   // Lock product master rows in a consistent order with inventory movement writers.
   $products=DB::table('products')->where('company_id',$co)->orderBy('id')->lockForUpdate()->get(['id']);
   $id=(string)Str::ulid();$now=now();
   DB::table('stocktakes')->insert(['id'=>$id,'company_id'=>$co,'warehouse_id'=>$d['warehouse_id'],'created_by'=>$r->user()->id,
    'number'=>'SO-'.strtoupper((string)Str::ulid()),'status'=>'counting','snapshot_at'=>$now,'note'=>$d['note']??null,'created_at'=>$now,'updated_at'=>$now]);
   foreach($products as $p){$sum=DB::table('inventory_movements')->where('company_id',$co)->where('warehouse_id',$d['warehouse_id'])
     ->where('product_id',$p->id)->sum('quantity');
    DB::table('stocktake_lines')->insert(['id'=>(string)Str::ulid(),'stocktake_id'=>$id,'product_id'=>$p->id,
     'expected_qty'=>D::format($this->signed((string)$sum),4),'created_at'=>$now,'updated_at'=>$now]);}
   AuditService::record($r->user(),'stocktake.created','stocktake',$id);
   return response()->json(['data'=>['id'=>$id,'lines'=>count($products)]],201);
  });
 }
 private function signed(string $value):int{return str_starts_with($value,'-')?-D::parse(substr($value,1),4):D::parse($value,4);}
 public function count(Request $r,string $id,string $line){$this->guard($r);
  $data=$r->validate(['counted_qty'=>['required','regex:/^\d{1,12}(?:\.\d{1,4})?$/']]);
  return DB::transaction(function()use($r,$id,$line,$data){$s=$this->stocktake($r,$id,true);abort_unless($s->status==='counting',409,'Stock opname sudah diposting.');
   $affected=DB::table('stocktake_lines')->where('stocktake_id',$s->id)->where('id',$line)->update(['counted_qty'=>$data['counted_qty'],
    'counted_by'=>$r->user()->id,'counted_at'=>now(),'updated_at'=>now()]);abort_unless($affected,404);
   AuditService::record($r->user(),'stocktake.counted','stocktake_line',$line,null,$data);
   return response()->json(['data'=>DB::table('stocktake_lines')->find($line)]);
  });
 }
 public function post(Request $r,string $id){$this->guard($r);
  return DB::transaction(function()use($r,$id){$s=$this->stocktake($r,$id,true);
   if($s->status==='posted')return response()->json(['data'=>$s,'already_processed'=>true]);
   abort_unless($s->status==='counting',409);$lines=DB::table('stocktake_lines')->where('stocktake_id',$id)->get();
   abort_if($lines->isEmpty(),422,'Tidak ada produk untuk dihitung.');
   abort_if($lines->contains(fn($l)=>$l->counted_qty===null),422,'Semua baris wajib dihitung sebelum posting.');
   $co=$r->user()->company_id;$now=now();$adjustments=0;
   foreach($lines->sortBy('product_id') as $line){
    $product=DB::table('products')->where('company_id',$co)->where('id',$line->product_id)->lockForUpdate()->first();abort_unless($product,404);
    $current=$this->signed((string)DB::table('inventory_movements')->where('company_id',$co)->where('warehouse_id',$s->warehouse_id)
     ->where('product_id',$line->product_id)->sum('quantity'));
    abort_unless($current===$this->signed((string)$line->expected_qty),409,'Stok berubah sejak snapshot. Buat stock opname baru.');
    $delta=D::parse((string)$line->counted_qty,4)-$current;
    if($delta!==0){$adjustments++;
     DB::table('inventory_movements')->insert(['id'=>(string)Str::ulid(),'company_id'=>$co,'product_id'=>$line->product_id,
      'warehouse_id'=>$s->warehouse_id,'actor_id'=>$r->user()->id,'quantity'=>D::format($delta,4),
      'unit_cost'=>$product->standard_cost,'movement_type'=>'stocktake_adjustment','reference'=>$s->number,
      'source_type'=>'stocktake','source_id'=>$id,'idempotency_key'=>'stocktake-'.$line->id,'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
     // Financial counterpart of the approved stock correction: no orphan stock changes.
     $amount=D::line(D::format(abs($delta),4),(string)$product->standard_cost);
     if($amount>0)(new JournalPostingService())->post($co,'stocktake_adjustment',$line->id,
      'Koreksi opname '.$s->number,$delta>0?'1300':'5100',$delta>0?'5100':'1300',D::format($amount),now()->toDateString());
    }
   }
   DB::table('stocktakes')->where('id',$id)->update(['status'=>'posted','posted_by'=>$r->user()->id,'posted_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'stocktake.posted','stocktake',$id,null,['adjustments'=>$adjustments]);
   return response()->json(['data'=>DB::table('stocktakes')->find($id),'adjustments'=>$adjustments]);
  });
 }
}
