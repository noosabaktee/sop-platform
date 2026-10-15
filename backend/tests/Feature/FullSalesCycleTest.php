<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\ExactDecimal as Dec;
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
  $warehouseUser=User::factory()->create(['company_id'=>$company->id,'role'=>'warehouse']);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'CYCLE-001','name'=>'PT Cycle','status'=>'active']);
  $product=Product::create(['company_id'=>$company->id,'sku'=>'CYCLE-PRODUCT','name'=>'Product A','standard_price'=>'1000000.00','standard_cost'=>'600000.00','is_active'=>true]);
  $warehouse=(string)\Illuminate\Support\Str::ulid();DB::table('warehouses')->insert(['id'=>$warehouse,'company_id'=>$company->id,'code'=>'CYCLE-WH','name'=>'Cycle Warehouse','is_active'=>true,'created_at'=>now(),'updated_at'=>now()]);
  DB::table('inventory_movements')->insert(['id'=>(string)\Illuminate\Support\Str::ulid(),'company_id'=>$company->id,'product_id'=>$product->id,'warehouse_id'=>$warehouse,'actor_id'=>$warehouseUser->id,
   'quantity'=>'3.0000','unit_cost'=>'600000.00','movement_type'=>'opening','reference'=>'Opening Cycle','posted_at'=>now(),'created_at'=>now(),'updated_at'=>now()]);
  $payload=['customer_id'=>$customer->id,'owner_id'=>$sales->id,'currency'=>'IDR',
   'valid_until'=>today()->addDays(10)->format('Y-m-d'),'discount_percent'=>10,'tax_percent'=>11,
   'items'=>[['product_id'=>$product->id,'description'=>'Product A','quantity'=>3,'unit_price'=>'1000000.07']]];
  $this->actingAs($sales);
  $draft=$this->postJson('/api/v1/quotation-builder/draft',$payload)->assertCreated()->json('data');
  $this->assertSame('2997000.21',(string)$draft['total']);
  $this->postJson("/api/v1/workflows/quotations/{$draft['id']}/submit")->assertOk();
  // Distinct manager decides, not the requester approving their own quote.
  $this->actingAs($approver);
  $this->postJson("/api/v1/workflows/quotations/{$draft['id']}/decision",['decision'=>'approved'])
   ->assertOk()->assertJsonPath('data.status','approved');
  foreach([['1100','Kas','asset'],['1200','Piutang','asset'],['1300','Persediaan','asset'],['4100','Pendapatan','income'],['5100','HPP','expense'],['2300','PPN Keluaran','liability']] as [$code,$name,$type]){
   DB::table('chart_of_accounts')->insert(['id'=>(string)\Illuminate\Support\Str::ulid(),
    'company_id'=>$company->id,'code'=>$code,'name'=>$name,'type'=>$type,'created_at'=>now(),'updated_at'=>now()]);
  }
  $this->actingAs($sales);
  $order=$this->postJson("/api/v1/workflows/quotations/{$draft['id']}/convert")->assertCreated()->json('data');
  $deliveries=[];for($part=1;$part<=3;$part++){
   $this->actingAs($warehouseUser);
   $deliveries[]=$this->postJson("/api/v1/workflows/sales-orders/{$order['id']}/deliver",['warehouse_id'=>$warehouse,'lines'=>[['product_id'=>$product->id,'quantity'=>'1.0000']],'idempotency_key'=>'cycle-delivery-key-'.$part])->assertCreated()->json('data');
  }
  $this->assertSame(270000019,array_sum(DB::table('sales_delivery_lines')->whereIn('sales_delivery_id',array_column($deliveries,'id'))->pluck('net_amount')->map(fn($amount)=>Dec::parse((string)$amount))->all()));
  $this->assertSame(3,DB::table('journal_entries')->where('company_id',$company->id)->where('source_type','sales_delivery')->count());
  $this->actingAs($finance);
  $invoice=$this->postJson("/api/v1/workflows/sales-orders/{$order['id']}/invoice")->assertCreated()->json('data');
  $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments",[
   'amount'=>'220000.00','paid_at'=>today()->toDateString(),'idempotency_key'=>'cycle-key-payment-one'])
   ->assertCreated()->assertJsonPath('data.invoice.status','partial');
  $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments",[
   'amount'=>'2777000.21','paid_at'=>today()->toDateString(),'idempotency_key'=>'cycle-key-payment-two'])
   ->assertCreated()->assertJsonPath('data.invoice.status','paid');
  $this->assertSame('2997000.21',(string)DB::table('invoices')->where('id',$invoice['id'])->value('paid_amount'));
  $this->assertSame(2,DB::table('payments')->where('invoice_id',$invoice['id'])->count());
  $this->assertSame(3,DB::table('journal_entries')->where('company_id',$company->id)
   ->whereIn('source_type',['sales_invoice','customer_payment'])->count());
  $taxAccount=DB::table('chart_of_accounts')->where('company_id',$company->id)->where('code','2300')->value('id');
  $this->assertTrue(DB::table('journal_lines')->where('account_id',$taxAccount)->exists());
  $this->getJson('/api/v1/operational/accounting')->assertOk()->assertJsonPath('data.balanced',true);

  $this->getJson('/api/v1/operational/sales')->assertOk()->assertJsonPath('data.invoices.0.status','paid');
  $credits=[];foreach($deliveries as $part=>$delivery){$deliveryLine=DB::table('sales_delivery_lines')->where('sales_delivery_id',$delivery['id'])->firstOrFail();
   $this->actingAs($warehouseUser);
   $return=$this->postJson("/api/v1/workflows/sales-deliveries/{$delivery['id']}/return",['reason'=>'Barang dikembalikan sebagian','idempotency_key'=>'cycle-return-key-'.$part,'lines'=>[['delivery_line_id'=>$deliveryLine->id,'quantity'=>'1.0000']]])->assertCreated()->json('data');
   $this->actingAs($finance);$credits[]=$this->postJson("/api/v1/workflows/sales-returns/{$return['id']}/credit-note")->assertCreated()->json('data');
  }
  $this->assertSame(299700021,array_sum(array_map(fn($credit)=>Dec::parse((string)$credit['credit_note']['amount']),$credits)));
  $this->assertSame(299700021,array_sum(array_map(fn($credit)=>Dec::parse((string)$credit['refund']['amount']),$credits)));
  $this->assertDatabaseHas('invoices',['id'=>$invoice['id'],'amount'=>'0.00','paid_amount'=>'0.00','status'=>'paid']);
 }
}
