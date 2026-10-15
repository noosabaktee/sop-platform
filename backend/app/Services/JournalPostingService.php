<?php
namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Atomic double-entry posting with one authoritative journal per business source. */
class JournalPostingService {
 public function post(string $company,string $sourceType,string $sourceId,string $memo,string $debitCode,string $creditCode,string $amount,string $date):string {
  return $this->postLines($company,$sourceType,$sourceId,$memo,$date,[
   ['code'=>$debitCode,'debit'=>$amount,'credit'=>'0.00'],
   ['code'=>$creditCode,'debit'=>'0.00','credit'=>$amount],
  ]);
 }
 public function postSalesInvoice(string $company,string $invoiceId,string $salesOrderId,string $amount,string $date):string {
  $order=DB::table('sales_orders')->where('company_id',$company)->where('id',$salesOrderId)->first();abort_unless($order,404);
  $tax=0;
  if($order->quotation_id){$q=DB::table('quotations')->where('company_id',$company)->where('id',$order->quotation_id)->first();
   if($q)$tax=ExactDecimal::parse((string)$q->tax);
  }
  $gross=ExactDecimal::parse($amount);
  abort_unless($tax>=0&&$tax<=$gross,422,'Pajak melebihi nilai invoice.');
  $lines=[['code'=>'1200','debit'=>$amount,'credit'=>'0.00'],
    ['code'=>'4100','debit'=>'0.00','credit'=>ExactDecimal::format($gross-$tax)]];
  if($tax>0)$lines[]=['code'=>'2300','debit'=>'0.00','credit'=>ExactDecimal::format($tax)];
  return $this->postLines($company,'sales_invoice',$invoiceId,'Invoice SO '.$order->number,$date,$lines);
 }
 /** Must be called inside the parent DB::transaction. */
 public function postLines(string $company,string $sourceType,string $sourceId,string $memo,string $date,array $lines):string {
  $old=DB::table('journal_entries')->where('company_id',$company)->where('source_type',$sourceType)
   ->where('source_id',$sourceId)->lockForUpdate()->first();
  if($old)return $old->id;
  app(AccountingPeriodService::class)->assertOpen($company,$date);
  $debit=0;$credit=0;$codes=[];
  foreach($lines as $line){
   $dr=ExactDecimal::parse((string)$line['debit']);$cr=ExactDecimal::parse((string)$line['credit']);
   if(($dr>0&&$cr>0)||($dr===0&&$cr===0))throw ValidationException::withMessages(['journal'=>'Baris jurnal harus debit atau kredit.']);
   $debit+=$dr;$credit+=$cr;$codes[]=$line['code'];
  }
  if($debit<=0||$debit!==$credit)throw ValidationException::withMessages(['journal'=>'Jurnal tidak balance.']);
  $accounts=DB::table('chart_of_accounts')->where('company_id',$company)->whereIn('code',array_unique($codes))->pluck('id','code');
  foreach($codes as $code)abort_unless(isset($accounts[$code]),422,'Chart of Accounts belum lengkap: '.$code);
  $id=(string)Str::ulid();$now=now();
  DB::table('journal_entries')->insert(['id'=>$id,'company_id'=>$company,'number'=>'JRN-'.strtoupper((string)Str::ulid()),
    'description'=>$memo,'posting_date'=>$date,'status'=>'posted','source_type'=>$sourceType,'source_id'=>$sourceId,
    'created_at'=>$now,'updated_at'=>$now]);
  foreach($lines as $line){DB::table('journal_lines')->insert([
   'id'=>(string)Str::ulid(),'journal_entry_id'=>$id,'account_id'=>$accounts[$line['code']],
   'debit'=>$line['debit'],'credit'=>$line['credit'],'created_at'=>$now,'updated_at'=>$now]);}
  return $id;
 }
}
