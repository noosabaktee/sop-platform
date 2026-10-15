<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class SalesOperationalViewTest extends TestCase {
 use RefreshDatabase;
 public function test_invoice_payment_and_receivable_are_read_from_postgresql_for_current_company():void{
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id,'role'=>'finance']);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'QA1','name'=>'PT Pembeli']);
  $quotation=(string)Str::ulid();DB::table('quotations')->insert(['id'=>$quotation,'company_id'=>$company->id,'customer_id'=>$customer->id,
   'owner_id'=>$user->id,'number'=>'QT-QA-001','status'=>'approved','currency'=>'IDR','subtotal'=>'1000.00','tax'=>'0.00','total'=>'1000.00','version'=>1,'created_at'=>now(),'updated_at'=>now()]);
  $order=(string)Str::ulid();DB::table('sales_orders')->insert(['id'=>$order,'company_id'=>$company->id,'quotation_id'=>$quotation,'customer_id'=>$customer->id,
   'number'=>'SO-QA-001','status'=>'confirmed','total'=>'1000.00','created_at'=>now(),'updated_at'=>now()]);
  $id=(string)Str::ulid();
  DB::table('invoices')->insert(['id'=>$id,'company_id'=>$company->id,'customer_id'=>$customer->id,
   'number'=>'INV-QA-001','amount'=>'1000.00','paid_amount'=>'250.00','status'=>'partial',
   // Match PostgreSQL CURRENT_DATE used by the projection. This stays stable
   // when PHP and PostgreSQL cross midnight in different time zones.
   'due_date'=>DB::raw('CURRENT_DATE - 3'),'created_at'=>now(),'updated_at'=>now()]);
  DB::table('payments')->insert(['id'=>(string)Str::ulid(),'company_id'=>$company->id,
   'invoice_id'=>$id,'number'=>'PAY-QA-001','amount'=>'250.00','paid_at'=>today(),
   'created_at'=>now(),'updated_at'=>now()]);
  $this->actingAs($user)->getJson('/api/v1/operational/sales')->assertOk()
   ->assertJsonPath('data.orders.0.number','SO-QA-001')
   ->assertJsonPath('data.invoices.0.number','INV-QA-001')
   ->assertJsonPath('data.payments.0.number','PAY-QA-001')
   ->assertJsonPath('data.receivables.0.outstanding','750.00')
   ->assertJsonPath('data.receivables.0.days_overdue',3);
 }
 public function test_other_company_invoices_not_leaked():void {
  $a=Company::factory()->create();$b=Company::factory()->create();
  $c=Customer::create(['company_id'=>$b->id,'code'=>'OTHER','name'=>'Hidden']);
  DB::table('invoices')->insert(['id'=>(string)Str::ulid(),'company_id'=>$b->id,'customer_id'=>$c->id,
   'number'=>'INV-SECRET','amount'=>'900.00','paid_amount'=>'0.00','created_at'=>now(),'updated_at'=>now()]);
  $this->actingAs(User::factory()->create(['company_id'=>$a->id]))->getJson('/api/v1/operational/sales')
   ->assertOk()->assertJsonCount(0,'data.orders')->assertJsonCount(0,'data.invoices')->assertJsonCount(0,'data.receivables');
 }
}
