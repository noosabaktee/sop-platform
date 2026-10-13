<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\JournalPostingService;
use App\Services\OperationalNotification;
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
   DB::table('transaction_approvals')->insert(['id'=>$approval,'company_id'=>$this->company($r),'subject_type'=>'quotation','subject_id'=>$id,
     'requester_id'=>$r->user()->id,'status'=>'pending','comment'=>$data['comment']??null,'created_at'=>now(),'updated_at'=>now()]);
   app(OperationalNotification::class)->toApprovers($this->company($r),(string)$r->user()->id,
    'quotation.approval_requested',['subject_id'=>$id,'number'=>$q->number]);
   AuditService::record($r->user(),'quotation.submitted','quotation',$id,['status'=>$q->status],['status'=>'pending_approval','approval_id'=>$approval]);
   return response()->json(['data'=>['quotation_id'=>$id,'approval_id'=>$approval,'status'=>'pending_approval']]);
  });
 }
 public function decideQuotation(Request $r,string $id){
  abort_unless($r->user()->canManageRecords(),403,'Hanya approver yang diizinkan.');
  $data=$r->validate(['decision'=>['required',Rule::in(['approved','rejected','revision_requested'])],'comment'=>['nullable','string','max:2000']]);
  return DB::transaction(function()use($r,$id,$data){
   $q=$this->scoped($r,'quotations',$id);
   abort_unless($q->status==='pending_approval',409,'Quotation tidak sedang menunggu approval.');
   abort_if($q->owner_id===$r->user()->id && $r->user()->role!=='super_admin',403,'Pembuat tidak dapat menyetujui sendiri.');
   $ap=DB::table('transaction_approvals')->where('company_id',$this->company($r))->where('subject_type','quotation')
     ->where('subject_id',$id)->where('status','pending')->lockForUpdate()->first();
   abort_unless($ap,409,'Approval aktif tidak ditemukan.');
   if($data['decision']!=='approved')abort_unless(trim((string)($data['comment']??''))!=='',422,'Alasan penolakan atau revisi wajib diisi.');
   DB::table('transaction_approvals')->where('id',$ap->id)->update(['status'=>$data['decision'],'comment'=>$data['comment']??null,
    'approver_id'=>$r->user()->id,'decided_at'=>now(),'updated_at'=>now()]);
   DB::table('quotations')->where('id',$id)->update(['status'=>$data['decision'],'version'=>$q->version+1,'updated_at'=>now()]);
   app(OperationalNotification::class)->toUser((string)$q->owner_id,'quotation.'.$data['decision'],
    ['subject_id'=>$id,'number'=>$q->number]);
   AuditService::record($r->user(),'quotation.'.$data['decision'],'quotation',$id,['status'=>$q->status],['status'=>$data['decision']]);
   return response()->json(['data'=>['quotation_id'=>$id,'status'=>$data['decision']]]);
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
   abort_unless($order->status==='confirmed',409,'Sales Order harus confirmed.');
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
  $items=DB::table('transaction_approvals as a')
   ->leftJoin('quotations as q',function($join){$join->on('q.id','=','a.subject_id')->where('a.subject_type','=','quotation');})
   ->leftJoin('purchase_requests as pr',function($join){$join->on('pr.id','=','a.subject_id')->where('a.subject_type','=','purchase_request');})
   ->leftJoin('users as u','u.id','=','a.requester_id')
   ->where('a.company_id',$this->company($r))
   ->when(!$r->user()->canManageRecords(),fn($query)=>$query->where('a.requester_id',$r->user()->id))
   ->orderByDesc('a.created_at')
   ->select(['a.id','a.subject_id','a.subject_type','a.status','a.comment','a.created_at',
       DB::raw('COALESCE(q.number, pr.number) AS number'),
       DB::raw('COALESCE(q.total, pr.estimated_total) AS amount'),
       'u.name as requester','a.decided_at'])
   ->paginate(50);
  return response()->json($items);
 }
}
