<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as Dec;
use App\Services\JournalPostingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Vendor AP is derived from received goods; it never accepts an arbitrary vendor amount. */
class PayableOperationsController extends Controller {
 private function company(Request $r):string{return (string)$r->user()->company_id;}
 private function allowed(Request $r):void{abort_unless(in_array($r->user()->role,['super_admin','admin','manager','finance'],true),403);}
 private function number(string $prefix):string{return $prefix.'-'.date('Y').'-'.strtoupper((string)Str::ulid());}
 public function index(Request $r){$co=$this->company($r);
  $bills=DB::table('vendor_bills as b')->join('vendors as v','v.id','=','b.vendor_id')->join('goods_receipts as gr','gr.id','=','b.goods_receipt_id')
   ->where('b.company_id',$co)->orderByDesc('b.created_at')->limit(300)
   ->get(['b.*','v.name as vendor','gr.number as goods_receipt']);
  $payments=DB::table('vendor_payments as p')->join('vendor_bills as b','b.id','=','p.vendor_bill_id')->join('vendors as v','v.id','=','b.vendor_id')
   ->where('p.company_id',$co)->orderByDesc('p.paid_at')->limit(300)->get(['p.*','b.number as bill_number','v.name as vendor']);
  $credits=DB::table('vendor_credit_notes as cn')->join('vendor_bills as b','b.id','=','cn.vendor_bill_id')->join('vendors as v','v.id','=','b.vendor_id')
   ->where('cn.company_id',$co)->orderByDesc('cn.created_at')->limit(300)->get(['cn.*','b.number as bill_number','v.name as vendor']);
  $refunds=DB::table('vendor_refunds as r')->join('vendor_bills as b','b.id','=','r.vendor_bill_id')->join('vendors as v','v.id','=','b.vendor_id')
   ->where('r.company_id',$co)->orderByDesc('r.created_at')->limit(300)->get(['r.*','b.number as bill_number','v.name as vendor']);
  return response()->json(['data'=>['bills'=>$bills,'payments'=>$payments,'credits'=>$credits,'refunds'=>$refunds]]);
 }
 public function options(Request $r){$co=$this->company($r);return response()->json(['data'=>[
  'receipts'=>DB::table('goods_receipts as gr')->join('purchase_orders as po','po.id','=','gr.purchase_order_id')->join('vendors as v','v.id','=','po.vendor_id')
   ->where('gr.company_id',$co)->whereExists(function($query){$query->selectRaw('1')->from('goods_receipt_lines as l')->whereColumn('l.goods_receipt_id','gr.id')
    ->whereRaw("l.quantity > COALESCE((SELECT SUM(ret.quantity) FROM purchase_returns ret WHERE ret.goods_receipt_line_id = l.id),0) + COALESCE((SELECT SUM(bl.quantity) FROM vendor_bill_lines bl WHERE bl.goods_receipt_line_id = l.id),0)");})
   ->orderByDesc('gr.received_at')->get(['gr.id','gr.number','gr.received_at','v.name as vendor']),
  'bills'=>DB::table('vendor_bills as b')->join('vendors as v','v.id','=','b.vendor_id')->where('b.company_id',$co)->whereIn('b.status',['posted','partial'])
   ->orderBy('b.due_date')->get(['b.id','b.number','b.amount','b.paid_amount','b.due_date','v.name as vendor']),
  'banks'=>DB::table('bank_accounts as b')->join('chart_of_accounts as a','a.id','=','b.coa_id')->where('b.company_id',$co)
   ->orderBy('b.name')->get(['b.id','b.name','b.currency','a.code as coa_code'])
 ]]);}
 public function postBill(Request $r){$this->allowed($r);$co=$this->company($r);
  $data=$r->validate(['goods_receipt_id'=>['required','ulid',Rule::exists('goods_receipts','id')->where('company_id',$co)],
   'due_date'=>['nullable','date'],'idempotency_key'=>['required','string','min:8','max:100'],
   'lines'=>['nullable','array','min:1','max:100'],'lines.*.goods_receipt_line_id'=>['required_with:lines','ulid'],
   'lines.*.quantity'=>['required_with:lines','numeric','gt:0','decimal:0,4']]);
  return DB::transaction(function()use($r,$co,$data){
   $receipt=DB::table('goods_receipts as gr')->join('purchase_orders as po','po.id','=','gr.purchase_order_id')->where('gr.company_id',$co)
    ->where('gr.id',$data['goods_receipt_id'])->lockForUpdate()->first(['gr.*','po.vendor_id','po.number as po_number']);abort_unless($receipt,404);
   $oldPosting=DB::table('vendor_bill_postings as p')->join('vendor_bills as b','b.id','=','p.vendor_bill_id')->where('p.company_id',$co)->where('p.idempotency_key',$data['idempotency_key'])->first(['b.*']);
   $old=$oldPosting?:DB::table('vendor_bills')->where('company_id',$co)->where('idempotency_key',$data['idempotency_key'])->first();
   if($old){abort_unless($old->goods_receipt_id===$receipt->id,409,'Idempotency key telah digunakan.');return response()->json(['data'=>$old,'already_exists'=>true]);}
   $lines=DB::table('goods_receipt_lines')->where('goods_receipt_id',$receipt->id)->lockForUpdate()->get()->keyBy('id');abort_unless($lines->isNotEmpty(),422,'Goods Receipt tidak memiliki item.');
   $available=[];foreach($lines as $line){
    $returned=Dec::parse((string)(DB::table('purchase_returns')->where('goods_receipt_line_id',$line->id)->sum('quantity')??0),4);
    $billed=Dec::parse((string)(DB::table('vendor_bill_lines')->where('goods_receipt_line_id',$line->id)->sum('quantity')??0),4);
    $net=Dec::parse((string)$line->quantity,4)-$returned-$billed;abort_unless($net>=0,409,'Kuantitas retur atau tagihan Goods Receipt tidak valid.');$available[$line->id]=$net;
   }
   $requested=$data['lines']??[];if(!$requested){foreach($available as $lineId=>$quantity){if($quantity>0)$requested[]=['goods_receipt_line_id'=>$lineId,'quantity'=>Dec::format($quantity,4)];}}
   $entries=[];$seen=[];$total=0;foreach($requested as $requestLine){$lineId=$requestLine['goods_receipt_line_id'];abort_unless(isset($lines[$lineId])&&!isset($seen[$lineId]),422,'Baris tagihan tidak valid atau duplikat.');$seen[$lineId]=true;
    $quantity=Dec::parse((string)$requestLine['quantity'],4);abort_unless($quantity<=$available[$lineId],422,'Kuantitas tagihan melebihi sisa Goods Receipt.');$amount=Dec::line(Dec::format($quantity,4),(string)$lines[$lineId]->unit_cost);abort_if($total>PHP_INT_MAX-$amount,422,'Nilai tagihan terlalu besar.');$total+=$amount;$entries[]=['goods_receipt_line_id'=>$lineId,'quantity'=>$quantity,'unit_cost'=>(string)$lines[$lineId]->unit_cost,'amount'=>$amount];}
   abort_unless($total>0,422,'Nilai tagihan harus positif.');$id=(string)Str::ulid();$now=now();
   $bill=DB::table('vendor_bills')->where('goods_receipt_id',$receipt->id)->lockForUpdate()->first();$postingType='vendor_bill';$postingId=$id;
   if($bill){$id=$bill->id;$amount=Dec::parse((string)$bill->amount)+$total;$paid=Dec::parse((string)$bill->paid_amount);DB::table('vendor_bills')->where('id',$id)->update(['amount'=>Dec::format($amount),'status'=>$paid===$amount?'paid':($paid>0?'partial':'posted'),'updated_at'=>$now]);$postingType='vendor_bill_increment';$postingId=(string)Str::ulid();}
   else DB::table('vendor_bills')->insert(['id'=>$id,'company_id'=>$co,'goods_receipt_id'=>$receipt->id,'vendor_id'=>$receipt->vendor_id,'posted_by'=>$r->user()->id,
    'number'=>$this->number('BILL'),'amount'=>Dec::format($total),'paid_amount'=>'0.00','status'=>'posted','due_date'=>$data['due_date']??now()->addDays(30)->toDateString(),
    'idempotency_key'=>$data['idempotency_key'],'created_at'=>$now,'updated_at'=>$now]);
   DB::table('vendor_bill_postings')->insert(['id'=>(string)Str::ulid(),'company_id'=>$co,'vendor_bill_id'=>$id,'idempotency_key'=>$data['idempotency_key'],'amount'=>Dec::format($total),'created_at'=>$now,'updated_at'=>$now]);
   foreach($entries as $entry)DB::table('vendor_bill_lines')->insert(['id'=>(string)Str::ulid(),'vendor_bill_id'=>$id,'goods_receipt_line_id'=>$entry['goods_receipt_line_id'],'quantity'=>Dec::format($entry['quantity'],4),'unit_cost'=>$entry['unit_cost'],'amount'=>Dec::format($entry['amount']),'created_at'=>$now,'updated_at'=>$now]);
   app(JournalPostingService::class)->post($co,$postingType,$postingId,'Tagihan vendor GR '.$receipt->number,'2200','2100',Dec::format($total),$now->toDateString());
   AuditService::record($r->user(),$bill?'vendor_bill.incremented':'vendor_bill.posted','vendor_bill',$id,null,['goods_receipt_id'=>$receipt->id,'amount'=>Dec::format($total)]);
   return response()->json(['data'=>DB::table('vendor_bills')->find($id)],201);
  });
 }
 public function pay(Request $r,string $id){$this->allowed($r);$co=$this->company($r);
  $data=$r->validate(['amount'=>['required','numeric','gt:0','decimal:0,2'],'paid_at'=>['required','date','before_or_equal:today'],'reference'=>['nullable','string','max:255'],
   'bank_account_id'=>['nullable','ulid',Rule::exists('bank_accounts','id')->where('company_id',$co)],'idempotency_key'=>['required','string','min:8','max:100']]);
  return DB::transaction(function()use($r,$id,$co,$data){
   $bill=DB::table('vendor_bills')->where('company_id',$co)->where('id',$id)->lockForUpdate()->first();abort_unless($bill,404);
   $old=DB::table('vendor_payments')->where('company_id',$co)->where('idempotency_key',$data['idempotency_key'])->first();
   if($old){abort_unless($old->vendor_bill_id===$id&&Dec::parse((string)$old->amount)===Dec::parse((string)$data['amount']),409,'Idempotency key telah digunakan.');return response()->json(['data'=>$old,'already_exists'=>true]);}
   abort_unless(in_array($bill->status,['posted','partial'],true),409,'Tagihan belum dapat dibayar.');$amount=Dec::parse((string)$data['amount']);$paid=Dec::parse((string)$bill->paid_amount);$total=Dec::parse((string)$bill->amount);
   abort_unless($paid+$amount<=$total,422,'Pembayaran melebihi saldo utang.');$bankCode='1100';$bankId=$data['bank_account_id']??null;
   if($bankId){$bankCode=(string)DB::table('bank_accounts as b')->join('chart_of_accounts as a','a.id','=','b.coa_id')->where('b.company_id',$co)->where('b.id',$bankId)->value('a.code');abort_unless($bankCode,422,'Akun bank tidak valid.');}
   $payment=(string)Str::ulid();$now=now();DB::table('vendor_payments')->insert(['id'=>$payment,'company_id'=>$co,'vendor_bill_id'=>$id,'bank_account_id'=>$bankId,
    'paid_by'=>$r->user()->id,'number'=>$this->number('VPAY'),'amount'=>Dec::format($amount),'paid_at'=>$data['paid_at'],'reference'=>$data['reference']??null,
    'idempotency_key'=>$data['idempotency_key'],'created_at'=>$now,'updated_at'=>$now]);
   DB::table('vendor_bills')->where('id',$id)->update(['paid_amount'=>Dec::format($paid+$amount),'status'=>$paid+$amount===$total?'paid':'partial','updated_at'=>$now]);
   app(JournalPostingService::class)->post($co,'vendor_payment',$payment,'Pembayaran tagihan '.$bill->number,'2100',$bankCode,Dec::format($amount),$data['paid_at']);
   AuditService::record($r->user(),'vendor_bill.paid','vendor_bill',$id,['paid_amount'=>$bill->paid_amount],['payment_id'=>$payment,'paid_amount'=>Dec::format($paid+$amount)]);
   return response()->json(['data'=>['payment'=>DB::table('vendor_payments')->find($payment),'bill'=>DB::table('vendor_bills')->find($id)]],201);
  });
 }
}
