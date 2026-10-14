<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProcurementInventoryAccountingTest extends TestCase {
 use RefreshDatabase;
 private function setupApi():array{
  $this->seed(DatabaseSeeder::class);
  $company=Company::where('code','SOP-DEMO')->firstOrFail();
  $admin=User::where('email','admin@sop.local')->firstOrFail();
  $requester=User::where('email','rina@sop.local')->firstOrFail();
  $this->actingAs($requester);
  return [$company,$admin,$requester,
   DB::table('products')->where('company_id',$company->id)->first(),
   DB::table('warehouses')->where('company_id',$company->id)->first(),
   DB::table('vendors')->where('company_id',$company->id)->first()];
 }
 public function test_purchase_cycle_receipt_stock_return_and_balanced_journal():void {
  [$co,$manager,$sales,$product,$warehouse,$vendor]=$this->setupApi();
  $before=DB::table('inventory_movements')->where('product_id',$product->id)->where('warehouse_id',$warehouse->id)->sum('quantity');
  $pr=$this->postJson('/api/v1/workflows/purchase-requests',[
   'lines'=>[['product_id'=>$product->id,'quantity'=>'4.0000','unit_price'=>'1250.00']]
  ])->assertCreated()->json('data');
  $this->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/submit')->assertOk();
  // A requester without procurement authority is rejected before transaction state is disclosed.
  $this->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/order',['vendor_id'=>$vendor->id])->assertForbidden();
  $this->actingAs($manager)->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/decision',['decision'=>'approved'])->assertOk();
  $po=$this->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/order',['vendor_id'=>$vendor->id])->assertCreated()->json('data');
  $line=DB::table('purchase_order_lines')->where('purchase_order_id',$po['id'])->first();
  $payload=['warehouse_id'=>$warehouse->id,'received_at'=>today()->toDateString(),'reference'=>'RECEIPT-TEST-01',
   'lines'=>[['order_line_id'=>$line->id,'quantity'=>'2.0000']]];
  $receipt=$this->postJson('/api/v1/workflows/purchase-orders/'.$po['id'].'/receive',$payload)->assertCreated()->json('data');
  $this->postJson('/api/v1/workflows/purchase-orders/'.$po['id'].'/receive',$payload)->assertOk()->assertJsonPath('already_exists',true);
  $this->assertSame('partial',(string)DB::table('purchase_orders')->where('id',$po['id'])->value('status'));
  $receiptLine=DB::table('goods_receipt_lines')->where('goods_receipt_id',$receipt['id'])->firstOrFail();
  $this->postJson('/api/v1/workflows/goods-receipts/'.$receipt['id'].'/return',[
   'receipt_line_id'=>$receiptLine->id,'quantity'=>'3.0000','reason'=>'Barang tidak sesuai PO'])->assertUnprocessable();
  $this->postJson('/api/v1/workflows/goods-receipts/'.$receipt['id'].'/return',[
   'receipt_line_id'=>$receiptLine->id,'quantity'=>'1.0000','reason'=>'Barang rusak dari pengiriman'])->assertCreated();
  $after=DB::table('inventory_movements')->where('product_id',$product->id)->where('warehouse_id',$warehouse->id)->sum('quantity');
  $this->assertEquals((float)$before+1,(float)$after);
  $this->assertSame(1,DB::table('goods_receipts')->where('purchase_order_id',$po['id'])->count());
  $this->getJson('/api/v1/operational/accounting')->assertOk()->assertJsonPath('data.balanced',true);
 }
 public function test_cross_company_cannot_receive_purchase_order():void {
  [$co,$manager]=$this->setupApi();
  $order=DB::table('purchase_orders')->where('company_id',$co->id)->firstOrFail();
  $other=Company::factory()->create();$alien=User::factory()->create(['company_id'=>$other->id,'role'=>'manager']);
  $this->actingAs($alien)->postJson('/api/v1/workflows/purchase-orders/'.$order->id.'/receive',[
   'warehouse_id'=>(string)DB::table('warehouses')->where('company_id',$co->id)->value('id'),
   'received_at'=>today()->toDateString(),'reference'=>'TEST-CROSS-TENANT',
   'lines'=>[['order_line_id'=>(string)DB::table('purchase_order_lines')->value('id'),'quantity'=>'1.0000']]
  ])->assertUnprocessable();
 }
 public function test_stock_adjustment_is_idempotent_and_cannot_create_negative_stock():void{
  [$co,$manager,$sales,$product,$warehouse]=$this->setupApi();$this->actingAs($manager);
  $payload=['product_id'=>$product->id,'warehouse_id'=>$warehouse->id,
   'quantity'=>'1.0000','reason'=>'Perhitungan opname QA','idempotency_key'=>'stock-adjustment-test-01'];
  $this->postJson('/api/v1/operational/inventory/adjust',$payload)->assertCreated();
  $this->postJson('/api/v1/operational/inventory/adjust',$payload)->assertOk()->assertJsonPath('already_exists',true);
  $payload['idempotency_key']='stock-adjustment-test-02';$payload['quantity']='-99999.0000';
  $this->postJson('/api/v1/operational/inventory/adjust',$payload)->assertStatus(422);
  $this->assertSame(1,DB::table('inventory_movements')->where('company_id',$co->id)
   ->where('movement_type','manual_adjustment')->count());
 }
 public function test_manual_journal_must_balance():void{
  [$co,$manager]=$this->setupApi();$this->actingAs($manager);
  $ids=DB::table('chart_of_accounts')->where('company_id',$co->id)->whereIn('code',['1100','4100'])->pluck('id','code');
  $payload=['date'=>today()->toDateString(),'description'=>'Journal QA','source_id'=>(string)\Illuminate\Support\Str::ulid(),
   'lines'=>[['account_id'=>$ids['1100'],'debit'=>'100.00','credit'=>'0.00'],
             ['account_id'=>$ids['4100'],'debit'=>'0.00','credit'=>'90.00']]];
  $this->postJson('/api/v1/operational/accounting/journal',$payload)->assertUnprocessable();
  $payload['lines'][1]['credit']='100.00';
  $this->postJson('/api/v1/operational/accounting/journal',$payload)->assertCreated();
  $this->postJson('/api/v1/operational/accounting/journal',$payload)->assertOk()->assertJsonPath('already_exists',true);
 }
}
