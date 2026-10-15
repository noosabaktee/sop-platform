<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\JournalPostingService;
use App\Services\OperationalNotification;
use App\Services\ExactDecimal as Dec;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Authoritative, transactional domain workflow. Grid snapshots are NOT business ledgers. */
class SalesWorkflowController extends Controller {
 private function company(Request $r):string { return (string)$r->user()->company_id; }
 private function scoped(Request $r,string $table,string $id,bool $locked=true):object {
  $q=DB::table($table)->where('company_id',$this->company($r))->where('id',$id);
  $record=($locked?$q->lockForUpdate():$q)->first();
  abort_unless($record,404);
  return $record;
 }
 private function cents(string $n):int {
  // Strict decimal arithmetic for Indonesian financial transactions. Do not use floats.
  if(!preg_match('/^\d{1,14}(?:\.\d{1,2})?$/',$n))throw ValidationException::withMessages(['amount'=>'Jumlah tidak valid']);
  [$a,$b]=array_pad(explode('.',$n,2),2,'');
  return ((int)$a)*100+(int)str_pad($b,2,'0');
 }
 private function money(int $cents):string {return sprintf('%d.%02d',intdiv($cents,100),$cents%100);}
 private function number(string $prefix):string {return $prefix.'-'.date('Y').'-'.strtoupper((string)Str::ulid());}
 private function gcd(int $left,int $right):int {while($right!==0){$next=$left%$right;$left=$right;$right=$next;}return $left;}
 /** Integer proportional allocation with cancellation before multiplication; never uses float money. */
 private function proportion(int $amount,int $numerator,int $denominator):int {
  if($amount===0||$numerator===0)return 0;abort_unless($denominator>0&&$numerator>=0&&$numerator<=$denominator,422,'Proporsi nilai transaksi tidak valid.');
  $one=$this->gcd($amount,$denominator);$amount=intdiv($amount,$one);$denominator=intdiv($denominator,$one);
  $two=$this->gcd($numerator,$denominator);$numerator=intdiv($numerator,$two);$denominator=intdiv($denominator,$two);
  abort_if($amount>intdiv(PHP_INT_MAX-intdiv($denominator,2),$numerator),422,'Nilai transaksi terlalu besar.');
  return intdiv($amount*$numerator+intdiv($denominator,2),$denominator);
 }

 public function submitQuotation(Request $r,string $id){
  $data=$r->validate(['comment'=>['nullable','string','max:2000']]);
  return DB::transaction(function()use($r,$id,$data){
   $q=$this->scoped($r,'quotations',$id);
   abort_unless(in_array($r->user()->role,['super_admin','admin','manager','sales'],true),403);
   abort_unless(in_array($q->status,['draft','rejected','revision_requested'],true),409,'Hanya draft/rejected yang dapat disubmit.');
   abort_unless($this->cents((string)$q->total)>0,422,'Quotation harus memiliki nilai positif.');
   $items=DB::table('quotation_items')->where('quotation_id',$q->id)->count();
   abort_unless($items>0,422,'Quotation membutuhkan minimal satu item.');
   DB::table('quotations')->where('id',$id)->update(['status'=>'pending_approval','version'=>$q->version+1,'updated_at'=>now()]);
   DB::table('transaction_approvals')->where('company_id',$this->company($r))->where('subject_type','quotation')
     ->where('subject_id',$id)->where('status','pending')->update(['status'=>'superseded','updated_at'=>now()]);
   $approval=(string)Str::ulid();
   $matrix=\App\Services\ApprovalDelegationService::evaluateMatrix($this->company($r),'quotation',(float)$q->total);
   $tier=$matrix['level'];
   $dueAt=now()->addHours($matrix['sla_hours']);
   DB::table('transaction_approvals')->insert(['id'=>$approval,'company_id'=>$this->company($r),'subject_type'=>'quotation','subject_id'=>$id,
     'requester_id'=>$r->user()->id,'status'=>'pending','comment'=>$data['comment']??null,
     'tier'=>$tier,'due_at'=>$dueAt,'created_at'=>now(),'updated_at'=>now()]);
   app(OperationalNotification::class)->toApprovers($this->company($r),(string)$r->user()->id,
    'quotation.approval_requested',['subject_id'=>$id,'number'=>$q->number]);
   AuditService::record($r->user(),'quotation.submitted','quotation',$id,['status'=>$q->status],['status'=>'pending_approval','approval_id'=>$approval,'tier'=>$tier]);
   return response()->json(['data'=>['quotation_id'=>$id,'approval_id'=>$approval,'status'=>'pending_approval','tier'=>$tier,'due_at'=>$dueAt->toIso8601String()]]);
  });
 }
 public function decideQuotation(Request $r,string $id){
  $delegatedFromId=null;
  $canApprove=\App\Services\ApprovalDelegationService::isAuthorizedApprover($r->user(),'quotation',$this->company($r),$delegatedFromId);
  abort_unless($canApprove,403,'Hanya approver atau delegasi resmi yang diizinkan.');
  $data=$r->validate(['decision'=>['required',Rule::in(['approved','rejected','revision_requested'])],'comment'=>['nullable','string','max:2000']]);
  return DB::transaction(function()use($r,$id,$data,$delegatedFromId){
   $q=$this->scoped($r,'quotations',$id);
   abort_unless($q->status==='pending_approval',409,'Quotation tidak sedang menunggu approval.');
   abort_if($q->owner_id===$r->user()->id && $r->user()->role!=='super_admin',403,'Pembuat tidak dapat menyetujui sendiri.');
   $ap=DB::table('transaction_approvals')->where('company_id',$this->company($r))->where('subject_type','quotation')
     ->where('subject_id',$id)->where('status','pending')->lockForUpdate()->first();
   abort_unless($ap,409,'Approval aktif tidak ditemukan.');
   if($data['decision']!=='approved')abort_unless(trim((string)($data['comment']??''))!=='',422,'Alasan penolakan atau revisi wajib diisi.');
   DB::table('transaction_approvals')->where('id',$ap->id)->update(['status'=>$data['decision'],'comment'=>$data['comment']??null,
    'approver_id'=>$r->user()->id,'delegated_from_id'=>$delegatedFromId,'decided_at'=>now(),'updated_at'=>now()]);
   DB::table('quotations')->where('id',$id)->update(['status'=>$data['decision'],'version'=>$q->version+1,'updated_at'=>now()]);
   app(OperationalNotification::class)->toUser((string)$q->owner_id,'quotation.'.$data['decision'],
    ['subject_id'=>$id,'number'=>$q->number]);
   $auditMeta=['status'=>$data['decision']];
   if($delegatedFromId)$auditMeta['delegated_from_id']=$delegatedFromId;
   AuditService::record($r->user(),'quotation.'.$data['decision'],'quotation',$id,['status'=>$q->status],$auditMeta);
   return response()->json(['data'=>['quotation_id'=>$id,'status'=>$data['decision'],'delegated_from_id'=>$delegatedFromId]]);
  });
 }
 public function convertQuotation(Request $r,string $id){
  return DB::transaction(function()use($r,$id){
   $q=$this->scoped($r,'quotations',$id);
   abort_unless(in_array($r->user()->role,['super_admin','admin','manager','sales'],true),403);
   $existing=DB::table('sales_orders')->where('company_id',$this->company($r))->where('quotation_id',$id)->first();
   if($existing)return response()->json(['data'=>$existing,'already_exists'=>true]);
   abort_unless($q->status==='approved',409,'Quotation harus disetujui sebelum menjadi Sales Order.');
   $newId=(string)Str::ulid();
   DB::table('sales_orders')->insert(['id'=>$newId,'company_id'=>$this->company($r),'quotation_id'=>$q->id,
     'customer_id'=>$q->customer_id,'number'=>$this->number('SO'),'status'=>'confirmed','total'=>$q->total,
     'created_at'=>now(),'updated_at'=>now()]);
   AuditService::record($r->user(),'quotation.converted','sales_order',$newId,null,['quotation_id'=>$q->id]);
   return response()->json(['data'=>DB::table('sales_orders')->find($newId)],201);
  });
 }
 public function invoiceOrder(Request $r,string $id){
  $data=$r->validate(['due_date'=>['nullable','date','after_or_equal:today']]);
  return DB::transaction(function()use($r,$id,$data){
   $order=$this->scoped($r,'sales_orders',$id);
   abort_unless(in_array($r->user()->role,['super_admin','admin','manager','finance'],true),403);
   $existing=DB::table('invoices')->where('company_id',$this->company($r))->where('sales_order_id',$id)->first();
   if($existing)return response()->json(['data'=>$existing,'already_exists'=>true]);
   abort_unless(in_array($order->status,['confirmed','delivered'],true),409,'Sales Order harus confirmed atau delivered.');
   abort_unless($this->cents((string)$order->total)>0,422,'Total Sales Order tidak valid.');
   $newId=(string)Str::ulid();
   DB::table('invoices')->insert(['id'=>$newId,'company_id'=>$this->company($r),'sales_order_id'=>$id,
     'customer_id'=>$order->customer_id,'number'=>$this->number('INV'),'amount'=>$order->total,
     'paid_amount'=>'0.00','status'=>'posted','due_date'=>$data['due_date']??now()->addDays(30)->toDateString(),
     'created_at'=>now(),'updated_at'=>now()]);
   app(JournalPostingService::class)->postSalesInvoice($this->company($r),$newId,$id,
    (string)$order->total,now()->toDateString());
   AuditService::record($r->user(),'invoice.posted','invoice',$newId,null,['sales_order_id'=>$id,'amount'=>$order->total]);
   return response()->json(['data'=>DB::table('invoices')->find($newId)],201);
  });
 }
 public function deliverOrder(Request $r,string $id){
  $co=$this->company($r);abort_unless(in_array($r->user()->role,['super_admin','admin','manager','warehouse'],true),403);
  $data=$r->validate(['warehouse_id'=>['required','ulid',Rule::exists('warehouses','id')->where('company_id',$co)],
   'idempotency_key'=>['required','string','min:8','max:95'],'lines'=>['nullable','array','min:1','max:100'],
   'lines.*.product_id'=>['required_with:lines','ulid',Rule::exists('products','id')->where('company_id',$co)],
   'lines.*.quantity'=>['required_with:lines','numeric','gt:0','decimal:0,4'],
   'lines.*.batch_number'=>['nullable','string','max:100']]);
  return DB::transaction(function()use($r,$id,$co,$data){
   $order=$this->scoped($r,'sales_orders',$id);
   $existing=DB::table('sales_deliveries')->where('company_id',$co)->where('idempotency_key',$data['idempotency_key'])->first();
   if($existing){abort_unless($existing->sales_order_id===$id,409,'Idempotency key sudah digunakan untuk Sales Order lain.');return response()->json(['data'=>$existing,'already_exists'=>true]);}
   abort_unless(in_array($order->status,['confirmed','partial_delivered'],true),409,'Sales Order tidak dapat dikirim.');
   abort_unless($order->quotation_id,422,'Sales Order tanpa quotation belum dapat dikirim dari stok.');
   $quote=DB::table('quotations')->where('company_id',$co)->where('id',$order->quotation_id)->first(['subtotal','discount_total']);abort_unless($quote,422,'Quotation Sales Order tidak valid.');
   $quoteSubtotal=$this->cents((string)$quote->subtotal);$quoteDiscount=$this->cents((string)$quote->discount_total);abort_unless($quoteSubtotal>0&&$quoteDiscount<=$quoteSubtotal,422,'Diskon quotation tidak valid.');
   $items=DB::table('quotation_items as qi')->join('products as p','p.id','=','qi.product_id')
    ->where('qi.quotation_id',$order->quotation_id)->where('p.company_id',$co)->whereNotNull('qi.product_id')
    ->groupBy('qi.product_id')->get(['qi.product_id',DB::raw('SUM(qi.quantity) as quantity'),DB::raw('SUM(qi.line_total) as gross_amount'),DB::raw('CAST(SUM(qi.line_total) / NULLIF(SUM(qi.quantity), 0) AS numeric(20,2)) as unit_price'),DB::raw('MAX(p.standard_cost) as standard_cost')])->keyBy('product_id');
   abort_unless($items->isNotEmpty(),422,'Quotation tidak memiliki produk stok untuk dikirim.');
   $delivered=DB::table('sales_delivery_lines as dl')->join('sales_deliveries as d','d.id','=','dl.sales_delivery_id')->where('d.sales_order_id',$id)
    ->groupBy('dl.product_id')->select('dl.product_id')->selectRaw('SUM(dl.quantity) as delivered_quantity')->pluck('delivered_quantity','product_id');
   $requested=[];
   foreach($data['lines']??[] as $line){$product=$line['product_id'];abort_unless(isset($items[$product]),422,'Produk tidak ada pada Sales Order.');abort_if(isset($requested[$product]),422,'Duplikat produk delivery.');
    $qty=Dec::parse((string)$line['quantity'],4);$remaining=Dec::parse((string)$items[$product]->quantity,4)-Dec::parse((string)($delivered[$product]??'0'),4);abort_unless($qty<=$remaining,422,'Jumlah delivery melebihi sisa Sales Order.');$requested[$product]=['qty'=>$qty,'batch_number'=>$line['batch_number']??null];}
   if(!$requested)foreach($items as $product=>$item){$remaining=Dec::parse((string)$item->quantity,4)-Dec::parse((string)($delivered[$product]??'0'),4);if($remaining>0)$requested[$product]=['qty'=>$remaining,'batch_number'=>null];}
   abort_unless($requested,409,'Seluruh kuantitas Sales Order sudah dikirim.');
   $delivery=(string)Str::ulid();$now=now();$cost=0;
   DB::table('sales_deliveries')->insert(['id'=>$delivery,'company_id'=>$co,'sales_order_id'=>$id,'warehouse_id'=>$data['warehouse_id'],
    'created_by'=>$r->user()->id,'number'=>$this->number('DO'),'status'=>'delivered','delivered_at'=>$now,'idempotency_key'=>$data['idempotency_key'],
    'created_at'=>$now,'updated_at'=>$now]);
   foreach($requested as $productId=>$req){$item=$items[$productId];$qty=$req['qty'];$batchNum=$req['batch_number'];
    // The product lock serializes stock checks even when a product has no movement rows yet.
    DB::table('products')->where('company_id',$co)->where('id',$item->product_id)->lockForUpdate()->firstOrFail();
    $balQuery=DB::table('inventory_movements')->where('company_id',$co)
     ->where('warehouse_id',$data['warehouse_id'])->where('product_id',$item->product_id);
    if($batchNum)$balQuery->where('batch_number',$batchNum);
    $balance=Dec::parse((string)$balQuery->sum('quantity'),4);
    abort_unless($balance>=$qty,422,'Stok tidak cukup untuk pengiriman.');
    $unitCost=Dec::parse((string)$item->standard_cost);$cost+=Dec::line(Dec::format($qty,4),Dec::format($unitCost));
    $unitPrice=Dec::parse((string)$item->unit_price);$priorQuantity=Dec::parse((string)($delivered[$productId]??'0'),4);$itemQuantity=Dec::parse((string)$item->quantity,4);
    $productNet=$this->proportion($this->cents((string)$item->gross_amount),$quoteSubtotal-$quoteDiscount,$quoteSubtotal);
    $net=$this->proportion($productNet,$priorQuantity+$qty,$itemQuantity)-$this->proportion($productNet,$priorQuantity,$itemQuantity);
    $expDate=null;
    if($batchNum){
     $expDate=DB::table('inventory_movements')->where('company_id',$co)->where('product_id',$item->product_id)->where('batch_number',$batchNum)->whereNotNull('expiry_date')->value('expiry_date');
    }
    DB::table('sales_delivery_lines')->insert(['id'=>(string)Str::ulid(),'sales_delivery_id'=>$delivery,'product_id'=>$item->product_id,
     'quantity'=>Dec::format($qty,4),'unit_cost'=>Dec::format($unitCost),'unit_price'=>Dec::format($unitPrice),'net_amount'=>$this->money($net),
     'batch_number'=>$batchNum,'created_at'=>$now,'updated_at'=>$now]);
    DB::table('inventory_movements')->insert(['id'=>(string)Str::ulid(),'company_id'=>$co,'product_id'=>$item->product_id,
     'warehouse_id'=>$data['warehouse_id'],'actor_id'=>$r->user()->id,'quantity'=>Dec::format(-$qty,4),'unit_cost'=>Dec::format($unitCost),
     'movement_type'=>'sales_delivery','reference'=>$delivery,'batch_number'=>$batchNum,'expiry_date'=>$expDate,'idempotency_key'=>$data['idempotency_key'].'-'.$item->product_id,
     'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
   }
   $complete=true;foreach($items as $product=>$item){$totalDelivered=Dec::parse((string)($delivered[$product]??'0'),4)+(isset($requested[$product])?$requested[$product]['qty']:0);if($totalDelivered<Dec::parse((string)$item->quantity,4)){$complete=false;break;}}
   DB::table('sales_orders')->where('id',$id)->update(['status'=>$complete?'delivered':'partial_delivered','updated_at'=>$now]);
   if($cost>0)app(JournalPostingService::class)->post($co,'sales_delivery',$delivery,'HPP pengiriman '.$order->number,'5100','1300',Dec::format($cost),$now->toDateString());
   AuditService::record($r->user(),'sales_order.delivered','sales_delivery',$delivery,null,['sales_order_id'=>$id,'warehouse_id'=>$data['warehouse_id']]);
   return response()->json(['data'=>DB::table('sales_deliveries')->find($delivery)],201);
  });
 }
 public function orderDelivery(Request $r,string $id){$co=$this->company($r);$order=DB::table('sales_orders as so')->join('customers as c','c.id','=','so.customer_id')
  ->where('so.company_id',$co)->where('so.id',$id)->first(['so.*','c.name as customer']);abort_unless($order,404);abort_unless($order->quotation_id,422,'Sales Order tanpa quotation tidak memiliki line delivery.');
  $delivered=DB::table('sales_delivery_lines as dl')->join('sales_deliveries as d','d.id','=','dl.sales_delivery_id')->where('d.sales_order_id',$id)
   ->groupBy('dl.product_id')->select('dl.product_id',DB::raw('SUM(dl.quantity) as delivered_quantity'));
  $lines=DB::table('quotation_items as qi')->join('products as p','p.id','=','qi.product_id')->leftJoinSub($delivered,'delivered','delivered.product_id','=','qi.product_id')
   ->where('qi.quotation_id',$order->quotation_id)->whereNotNull('qi.product_id')->groupBy('qi.product_id','p.sku','p.name','delivered.delivered_quantity')
   ->get(['qi.product_id','p.sku','p.name as product',DB::raw('SUM(qi.quantity) as quantity'),DB::raw('COALESCE(delivered.delivered_quantity,0) as delivered_quantity')]);
  return response()->json(['data'=>['order'=>$order,'lines'=>$lines]]);
 }
 public function returnDelivery(Request $r,string $id){
  $co=$this->company($r);abort_unless(in_array($r->user()->role,['super_admin','admin','manager','warehouse'],true),403);
  $data=$r->validate(['reason'=>['required','string','min:6','max:2000'],'idempotency_key'=>['required','string','min:8','max:95'],
   'lines'=>['required','array','min:1','max:100'],'lines.*.delivery_line_id'=>['required','ulid'],'lines.*.quantity'=>['required','numeric','gt:0','decimal:0,4']]);
  return DB::transaction(function()use($r,$id,$co,$data){
   $delivery=DB::table('sales_deliveries')->where('company_id',$co)->where('id',$id)->lockForUpdate()->first();abort_unless($delivery,404);
   $existing=DB::table('sales_returns')->where('company_id',$co)->where('idempotency_key',$data['idempotency_key'])->first();
   if($existing){abort_unless($existing->sales_delivery_id===$id,409,'Idempotency key sudah digunakan untuk delivery lain.');return response()->json(['data'=>$existing,'already_exists'=>true]);}
   abort_unless(in_array($delivery->status,['delivered','partially_returned'],true),409,'Delivery tidak dapat diretur.');
   $deliveryLines=DB::table('sales_delivery_lines')->where('sales_delivery_id',$id)->lockForUpdate()->get()->keyBy('id');abort_unless($deliveryLines->isNotEmpty(),422,'Delivery tidak memiliki barang.');
   $submitted=[];foreach($data['lines'] as $line){$lineId=$line['delivery_line_id'];abort_unless(isset($deliveryLines[$lineId]),422,'Baris delivery tidak valid.');abort_if(isset($submitted[$lineId]),422,'Duplikat baris retur.');$submitted[$lineId]=true;
    $returned=Dec::parse((string)DB::table('sales_return_lines as rl')->join('sales_returns as sr','sr.id','=','rl.sales_return_id')->where('sr.sales_delivery_id',$id)->where('rl.product_id',$deliveryLines[$lineId]->product_id)->sum('rl.quantity'),4);
    abort_unless(Dec::parse((string)$line['quantity'],4)<=(Dec::parse((string)$deliveryLines[$lineId]->quantity,4)-$returned),422,'Retur melebihi kuantitas delivery yang tersisa.');}
   $return=(string)Str::ulid();$now=now();$cost=0;
   DB::table('sales_returns')->insert(['id'=>$return,'company_id'=>$co,'sales_delivery_id'=>$id,'warehouse_id'=>$delivery->warehouse_id,
    'created_by'=>$r->user()->id,'number'=>$this->number('SR'),'status'=>'received','reason'=>$data['reason'],'received_at'=>$now,
    'idempotency_key'=>$data['idempotency_key'],'created_at'=>$now,'updated_at'=>$now]);
   foreach($data['lines'] as $index=>$requested){$line=$deliveryLines[$requested['delivery_line_id']];$qty=Dec::parse((string)$requested['quantity'],4);$unitCost=Dec::parse((string)$line->unit_cost);$cost+=Dec::line(Dec::format($qty,4),Dec::format($unitCost));
    DB::table('sales_return_lines')->insert(['id'=>(string)Str::ulid(),'sales_return_id'=>$return,'product_id'=>$line->product_id,
     'quantity'=>Dec::format($qty,4),'unit_cost'=>Dec::format($unitCost),'created_at'=>$now,'updated_at'=>$now]);
    DB::table('inventory_movements')->insert(['id'=>(string)Str::ulid(),'company_id'=>$co,'product_id'=>$line->product_id,'warehouse_id'=>$delivery->warehouse_id,
     'actor_id'=>$r->user()->id,'quantity'=>Dec::format($qty,4),'unit_cost'=>Dec::format($unitCost),'movement_type'=>'sales_return','reference'=>$return,
     'batch_number'=>$line->batch_number,
     'idempotency_key'=>$data['idempotency_key'].'-'.$index,'posted_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
   }
   $complete=true;foreach($deliveryLines as $line){$returned=Dec::parse((string)DB::table('sales_return_lines as rl')->join('sales_returns as sr','sr.id','=','rl.sales_return_id')->where('sr.sales_delivery_id',$id)->where('rl.product_id',$line->product_id)->sum('rl.quantity'),4);
    if($returned<Dec::parse((string)$line->quantity,4)){$complete=false;break;}}
   DB::table('sales_deliveries')->where('id',$id)->update(['status'=>$complete?'returned':'partially_returned','updated_at'=>$now]);
   if($cost>0)app(JournalPostingService::class)->post($co,'sales_return',$return,'Reversal HPP retur '.$delivery->number,'1300','5100',Dec::format($cost),$now->toDateString());
   AuditService::record($r->user(),'sales_delivery.returned','sales_return',$return,null,['sales_delivery_id'=>$id,'reason'=>$data['reason'],'line_count'=>count($data['lines'])]);
   return response()->json(['data'=>DB::table('sales_returns')->find($return)],201);
  });
 }
 public function delivery(Request $r,string $id){$co=$this->company($r);$delivery=DB::table('sales_deliveries as d')->join('sales_orders as so','so.id','=','d.sales_order_id')
  ->join('customers as c','c.id','=','so.customer_id')->where('d.company_id',$co)->where('d.id',$id)->first(['d.*','so.number as sales_order','c.name as customer']);abort_unless($delivery,404);
  $returned=DB::table('sales_return_lines as rl')->join('sales_returns as sr','sr.id','=','rl.sales_return_id')->where('sr.sales_delivery_id',$id)
   ->groupBy('rl.product_id')->select('rl.product_id',DB::raw('SUM(rl.quantity) as returned_quantity'));
  $lines=DB::table('sales_delivery_lines as dl')->join('products as p','p.id','=','dl.product_id')->leftJoinSub($returned,'returned','returned.product_id','=','dl.product_id')
   ->where('dl.sales_delivery_id',$id)->get(['dl.id','dl.product_id','dl.quantity','dl.unit_cost','p.sku','p.name as product',DB::raw('COALESCE(returned.returned_quantity,0) as returned_quantity')]);
  return response()->json(['data'=>['delivery'=>$delivery,'lines'=>$lines]]);
 }
 public function creditReturn(Request $r,string $id){
  $co=$this->company($r);abort_unless(in_array($r->user()->role,['super_admin','admin','manager','finance'],true),403);
  return DB::transaction(function()use($r,$id,$co){
   $lockedReturn=DB::table('sales_returns')->where('company_id',$co)->where('id',$id)->lockForUpdate()->first();abort_unless($lockedReturn,404);
   $return=DB::table('sales_returns as sr')->join('sales_deliveries as d','d.id','=','sr.sales_delivery_id')->join('sales_orders as so','so.id','=','d.sales_order_id')
    ->leftJoin('invoices as i','i.sales_order_id','=','so.id')->join('quotations as q','q.id','=','so.quotation_id')->where('sr.company_id',$co)->where('sr.id',$id)
    ->first(['sr.*','d.number as delivery_number','so.id as sales_order_id','i.id as invoice_id','i.number as invoice_number','i.amount as invoice_amount','i.paid_amount','i.status as invoice_status','q.subtotal as quotation_subtotal','q.discount_total as quotation_discount','q.tax as quotation_tax']);
   abort_unless($return,404);
   $existing=DB::table('credit_notes')->where('sales_return_id',$id)->first();if($existing)return response()->json(['data'=>$existing,'already_exists'=>true]);
   abort_unless($return->invoice_id,422,'Sales Return ini belum memiliki invoice untuk dikreditkan.');
   $invoice=$this->scoped($r,'invoices',(string)$return->invoice_id);$return->invoice_amount=$invoice->amount;$return->paid_amount=$invoice->paid_amount;$return->invoice_status=$invoice->status;
   abort_unless(in_array($return->invoice_status,['posted','partial','paid'],true),409,'Invoice tidak dapat dikreditkan.');
   $lines=DB::table('sales_return_lines as rl')->join('sales_delivery_lines as dl',function($join)use($return){$join->on('dl.product_id','=','rl.product_id')->where('dl.sales_delivery_id','=',$return->sales_delivery_id);})
    ->where('rl.sales_return_id',$id)->get(['rl.product_id','rl.quantity','dl.quantity as delivery_quantity','dl.net_amount']);abort_unless($lines->isNotEmpty(),422,'Sales Return tidak memiliki baris barang.');
   $net=0;foreach($lines as $line){abort_unless($line->net_amount!==null,422,'Delivery lama belum memiliki nilai net; credit note harus dibuat manual.');$returned=Dec::parse((string)$line->quantity,4);$delivered=Dec::parse((string)$line->delivery_quantity,4);abort_unless($delivered>0,422,'Kuantitas delivery tidak valid.');
    $previous=Dec::parse((string)DB::table('sales_return_lines as prior')->join('sales_returns as psr','psr.id','=','prior.sales_return_id')->join('credit_notes as pcn','pcn.sales_return_id','=','psr.id')
     ->where('psr.sales_delivery_id',$return->sales_delivery_id)->where('prior.product_id',$line->product_id)->sum('prior.quantity'),4);abort_unless($previous+$returned<=$delivered,422,'Kuantitas credit note melebihi delivery.');
    $lineNet=$this->cents((string)$line->net_amount);$net+=$this->proportion($lineNet,$previous+$returned,$delivered)-$this->proportion($lineNet,$previous,$delivered);}
   $subtotal=$this->cents((string)$return->quotation_subtotal);$quoteTax=$this->cents((string)$return->quotation_tax);$quoteDiscount=$this->cents((string)$return->quotation_discount);$taxBase=$subtotal-$quoteDiscount;
   $priorNet=$this->cents((string)DB::table('credit_notes')->where('invoice_id',$return->invoice_id)->sum('net_amount'));abort_unless($priorNet+$net<=$taxBase,422,'Nilai credit note melebihi nilai net quotation.');$tax=$taxBase>0?$this->proportion($priorNet+$net,$quoteTax,$taxBase)-$this->proportion($priorNet,$quoteTax,$taxBase):0;$amount=$net+$tax;
   $invoiceAmount=$this->cents((string)$return->invoice_amount);$paid=$this->cents((string)$return->paid_amount);abort_unless($amount<=$invoiceAmount,422,'Nilai credit note melebihi nilai invoice.');
   $now=now();$creditId=(string)Str::ulid();$newAmount=$invoiceAmount-$amount;$refund=max(0,$paid-$newAmount);$newPaid=$paid-$refund;
   DB::table('credit_notes')->insert(['id'=>$creditId,'company_id'=>$co,'sales_return_id'=>$id,'invoice_id'=>$return->invoice_id,'posted_by'=>$r->user()->id,'number'=>$this->number('CN'),'net_amount'=>$this->money($net),'tax_amount'=>$this->money($tax),'amount'=>$this->money($amount),'status'=>'posted','created_at'=>$now,'updated_at'=>$now]);
   DB::table('invoices')->where('id',$return->invoice_id)->update(['amount'=>$this->money($newAmount),'paid_amount'=>$this->money($newPaid),'status'=>$newAmount===$newPaid?'paid':($newPaid>0?'partial':'posted'),'updated_at'=>$now]);
   $journal=[['code'=>'4100','debit'=>$this->money($net),'credit'=>'0.00']];if($tax>0)$journal[]=['code'=>'2300','debit'=>$this->money($tax),'credit'=>'0.00'];$journal[]=['code'=>'1200','debit'=>'0.00','credit'=>$this->money($amount)];
   app(JournalPostingService::class)->postLines($co,'sales_credit_note',$creditId,'Credit note retur '.$return->delivery_number,$now->toDateString(),$journal);
   $refundId=null;if($refund>0){$refundId=(string)Str::ulid();DB::table('customer_refunds')->insert(['id'=>$refundId,'company_id'=>$co,'credit_note_id'=>$creditId,'invoice_id'=>$return->invoice_id,'refunded_by'=>$r->user()->id,'number'=>$this->number('REF'),'amount'=>$this->money($refund),'status'=>'posted','created_at'=>$now,'updated_at'=>$now]);
    app(JournalPostingService::class)->post($co,'customer_refund',$refundId,'Refund pelanggan credit note '.$return->delivery_number,'1200','1100',$this->money($refund),$now->toDateString());}
   AuditService::record($r->user(),'sales_return.credited','credit_note',$creditId,null,['sales_return_id'=>$id,'invoice_id'=>$return->invoice_id,'amount'=>$this->money($amount),'refund_amount'=>$this->money($refund)]);
   return response()->json(['data'=>['credit_note'=>DB::table('credit_notes')->find($creditId),'refund'=>$refundId?DB::table('customer_refunds')->find($refundId):null]],201);
  });
 }
 public function payInvoice(Request $r,string $id){
  $data=$r->validate(['amount'=>['required','numeric','gt:0','decimal:0,2'],'paid_at'=>['required','date','before_or_equal:today'],
    'reference'=>['nullable','string','max:255'],'idempotency_key'=>['required','string','min:8','max:100']]);
  return DB::transaction(function()use($r,$id,$data){
   // Must take the same invoice lock on every concurrent payment before checking balance.
   $inv=$this->scoped($r,'invoices',$id);
   abort_unless(in_array($r->user()->role,['super_admin','admin','manager','finance'],true),403);
   $existing=DB::table('payments')->where('company_id',$this->company($r))->where('idempotency_key',$data['idempotency_key'])->first();
   if($existing){
    abort_unless($existing->invoice_id===$id && $this->cents((string)$existing->amount)===$this->cents((string)$data['amount']),409,'Idempotency key sudah digunakan untuk pembayaran lain.');
    return response()->json(['data'=>['payment'=>$existing,'invoice'=>$inv],'already_exists'=>true]);
   }
   abort_unless(in_array($inv->status,['posted','partial'],true),409,'Invoice belum diposting atau telah lunas.');
   $amount=$this->cents((string)$data['amount']);$total=$this->cents((string)$inv->amount);$paid=$this->cents((string)$inv->paid_amount);
   abort_unless($paid+$amount<=$total,422,'Pembayaran melebihi saldo piutang.');
   $newId=(string)Str::ulid();
   DB::table('payments')->insert(['id'=>$newId,'company_id'=>$this->company($r),'invoice_id'=>$id,
     'number'=>$this->number('PAY'),'amount'=>$this->money($amount),'paid_at'=>$data['paid_at'],
     'reference'=>$data['reference']??null,'idempotency_key'=>$data['idempotency_key'],'created_at'=>now(),'updated_at'=>now()]);
   DB::table('invoices')->where('id',$id)->update(['paid_amount'=>$this->money($paid+$amount),
     'status'=>($paid+$amount)===$total?'paid':'partial','updated_at'=>now()]);
   app(JournalPostingService::class)->post($this->company($r),'customer_payment',$newId,
    'Penerimaan pembayaran invoice '.$inv->number,'1100','1200',$this->money($amount),$data['paid_at']);
   AuditService::record($r->user(),'invoice.payment_received','invoice',$id,['paid_amount'=>$inv->paid_amount],
     ['paid_amount'=>$this->money($paid+$amount),'payment_id'=>$newId]);
   return response()->json(['data'=>['payment'=>DB::table('payments')->find($newId),'invoice'=>DB::table('invoices')->find($id)]],201);
  });
 }
 public function approvals(Request $r){
  $co=$this->company($r);
  \App\Services\ApprovalDelegationService::syncExpiredDelegations($co);
  $delegationScopes=[];
  if(!$r->user()->canManageRecords()){
   $delegationScopes=DB::table('approval_delegations')
     ->where('company_id',$co)->where('delegatee_id',$r->user()->id)->where('status','active')
     ->where('start_date','<=',now())->where('end_date','>=',now())->pluck('scope')->toArray();
  }
  $items=DB::table('transaction_approvals as a')
   ->leftJoin('quotations as q',function($join){$join->on('q.id','=','a.subject_id')->where('a.subject_type','=','quotation');})
   ->leftJoin('purchase_requests as pr',function($join){$join->on('pr.id','=','a.subject_id')->where('a.subject_type','=','purchase_request');})
   ->leftJoin('users as u','u.id','=','a.requester_id')
   ->leftJoin('users as u_del','u_del.id','=','a.delegated_from_id')
   ->where('a.company_id',$co)
   ->when(!$r->user()->canManageRecords(),function($query)use($r,$delegationScopes){
     if(empty($delegationScopes)){
      return $query->where('a.requester_id',$r->user()->id);
     }
     return $query->where(function($sub)use($r,$delegationScopes){
      $sub->where('a.requester_id',$r->user()->id);
      if(in_array('all',$delegationScopes,true)){
       $sub->orWhere('a.status','pending');
      }else{
       $sub->orWhere(function($typeSub)use($delegationScopes){
        $typeSub->where('a.status','pending')->whereIn('a.subject_type',$delegationScopes);
       });
      }
     });
   })
   ->orderByDesc('a.created_at')
   ->select(['a.id','a.subject_id','a.subject_type','a.status','a.comment','a.created_at',
       'a.tier','a.due_at','a.delegated_from_id','u_del.name as delegated_from_name',
       DB::raw('COALESCE(q.number, pr.number) AS number'),
       DB::raw('COALESCE(q.total, pr.estimated_total) AS amount'),
       'u.name as requester','a.decided_at'])
   ->paginate(50);
  return response()->json($items);
 }
}
