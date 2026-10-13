<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use Illuminate\Support\Str;
use App\Models\Quotation;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SalesWorkflowTest extends TestCase {
 use RefreshDatabase;
 private function setupWorkflow():array {
  $this->seed(DatabaseSeeder::class);
  $user=User::where('email','admin@sop.local')->firstOrFail();
  $this->actingAs($user);
  // Create an unsold quotation: seeder quotations already have Sales Orders.
  $customer=Customer::where('company_id',$user->company_id)->firstOrFail();
  $quotation=Quotation::create(['company_id'=>$user->company_id,'customer_id'=>$customer->id,'owner_id'=>$user->id,
    'number'=>'QT-TEST-'.strtoupper((string)Str::ulid()),'status'=>'draft','currency'=>'IDR',
    'subtotal'=>'1000.00','tax'=>'110.00','total'=>'1110.00','valid_until'=>today()->addDays(30)]);
  $quotation->items()->create(['description'=>'Service QA','quantity'=>1,'unit_price'=>'1000.00',
    'discount'=>'0.00','line_total'=>'1000.00']);
  return [$user,$quotation];
 }
 public function test_approved_quote_converts_to_exactly_one_order_then_invoice_and_reconciles_payments():void {
  [, $q]=$this->setupWorkflow();
  $this->postJson("/api/v1/workflows/quotations/{$q->id}/submit")->assertOk()->assertJsonPath('data.status','pending_approval');
  $this->postJson("/api/v1/workflows/quotations/{$q->id}/decision",['decision'=>'approved'])->assertOk();
  $order=$this->postJson("/api/v1/workflows/quotations/{$q->id}/convert")->assertCreated()->json('data');
  $this->postJson("/api/v1/workflows/quotations/{$q->id}/convert")->assertOk()->assertJsonPath('already_exists',true);
  $this->assertDatabaseCount('transaction_approvals',1);
  $this->assertDatabaseHas('sales_orders',['quotation_id'=>$q->id,'id'=>$order['id']]);
  $invoice=$this->postJson("/api/v1/workflows/sales-orders/{$order['id']}/invoice")->assertCreated()->json('data');
  $this->postJson("/api/v1/workflows/sales-orders/{$order['id']}/invoice")->assertOk()->assertJsonPath('already_exists',true);
  $amount=(string)$invoice['amount'];
  $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments",['amount'=>'1.00','paid_at'=>today()->toDateString(),'idempotency_key'=>'test-payment-01'])->assertCreated()->assertJsonPath('data.invoice.status','partial');
  $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments",['amount'=>'1.00','paid_at'=>today()->toDateString(),'idempotency_key'=>'test-payment-01'])->assertOk()->assertJsonPath('already_exists',true);
  $balance=(string)number_format(((int)round($amount*100)-100)/100,2,'.','');
  $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments",['amount'=>$balance,'paid_at'=>today()->toDateString(),'idempotency_key'=>'test-payment-02'])->assertCreated()->assertJsonPath('data.invoice.status','paid');
  $this->assertDatabaseHas('invoices',['id'=>$invoice['id'],'status'=>'paid']);
  $this->assertSame(2,DB::table('payments')->where('invoice_id',$invoice['id'])->count());
 }
 public function test_unapproved_quote_cannot_be_converted():void{
  [,$q]=$this->setupWorkflow();
  $this->postJson("/api/v1/workflows/quotations/{$q->id}/convert")->assertStatus(409);
 }
 public function test_users_cannot_operate_on_another_companys_quotation():void{
  [,$q]=$this->setupWorkflow();
  $other=Company::factory()->create();
  $this->actingAs(User::factory()->create(['company_id'=>$other->id]));
  $this->postJson("/api/v1/workflows/quotations/{$q->id}/submit")->assertNotFound();
 }
}
