<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Request-level integration from React contract to normalized PostgreSQL ledgers. */
class FullSalesCycleTest extends TestCase {
 use RefreshDatabase;
 public function test_draft_submit_approve_order_invoice_and_full_payment():void{
  $company=Company::factory()->create();
  $sales=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);
  $approver=User::factory()->create(['company_id'=>$company->id,'role'=>'manager']);
  $finance=User::factory()->create(['company_id'=>$company->id,'role'=>'finance']);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'CYCLE-001','name'=>'PT Cycle','status'=>'active']);
  $payload=['customer_id'=>$customer->id,'owner_id'=>$sales->id,'currency'=>'IDR',
   'valid_until'=>today()->addDays(10)->format('Y-m-d'),'discount_percent'=>0,'tax_percent'=>11,
   'items'=>[['description'=>'Product A','quantity'=>2,'unit_price'=>'1000000.00']]];
  foreach([['1100','Kas','asset'],['1200','Piutang','asset'],['4100','Pendapatan','income'],['2300','PPN Keluaran','liability']] as [$code,$name,$type]){
   DB::table('chart_of_accounts')->insert(['id'=>(string)\Illuminate\Support\Str::ulid(),
    'company_id'=>$company->id,'code'=>$code,'name'=>$name,'type'=>$type,'created_at'=>now(),'updated_at'=>now()]);
  }
  $this->actingAs($sales);
  $draft=$this->postJson('/api/v1/quotation-builder/draft',$payload)->assertCreated()->json('data');
  $this->assertSame('2220000.00',(string)$draft['total']);
  $this->postJson("/api/v1/workflows/quotations/{$draft['id']}/submit")->assertOk();
  // Distinct manager decides, not the requester approving their own quote.
  $this->actingAs($approver);
  $this->postJson("/api/v1/workflows/quotations/{$draft['id']}/decision",['decision'=>'approved'])
   ->assertOk()->assertJsonPath('data.status','approved');
  foreach([['1100','Kas','asset'],['1200','Piutang','asset'],['4100','Pendapatan','income'],['2300','PPN Keluaran','liability']] as [$code,$name,$type]){
   DB::table('chart_of_accounts')->insert(['id'=>(string)\Illuminate\Support\Str::ulid(),
    'company_id'=>$company->id,'code'=>$code,'name'=>$name,'type'=>$type,'created_at'=>now(),'updated_at'=>now()]);
  }
  $this->actingAs($sales);
  $order=$this->postJson("/api/v1/workflows/quotations/{$draft['id']}/convert")->assertCreated()->json('data');
  $this->actingAs($finance);
  $invoice=$this->postJson("/api/v1/workflows/sales-orders/{$order['id']}/invoice")->assertCreated()->json('data');
  $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments",[
   'amount'=>'220000.00','paid_at'=>today()->toDateString(),'idempotency_key'=>'cycle-key-payment-one'])
   ->assertCreated()->assertJsonPath('data.invoice.status','partial');
  $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments",[
   'amount'=>'2000000.00','paid_at'=>today()->toDateString(),'idempotency_key'=>'cycle-key-payment-two'])
   ->assertCreated()->assertJsonPath('data.invoice.status','paid');
  $this->assertSame('2220000.00',(string)DB::table('invoices')->where('id',$invoice['id'])->value('paid_amount'));
  $this->assertSame(2,DB::table('payments')->where('invoice_id',$invoice['id'])->count());
  $this->assertSame(3,DB::table('journal_entries')->where('company_id',$company->id)
   ->whereIn('source_type',['sales_invoice','customer_payment'])->count());
  $taxAccount=DB::table('chart_of_accounts')->where('company_id',$company->id)->where('code','2300')->value('id');
  $this->assertTrue(DB::table('journal_lines')->where('account_id',$taxAccount)->exists());
  $this->getJson('/api/v1/operational/accounting')->assertOk()->assertJsonPath('data.balanced',true);

  $this->getJson('/api/v1/operational/sales')->assertOk()->assertJsonPath('data.invoices.0.status','paid');
 }
}
