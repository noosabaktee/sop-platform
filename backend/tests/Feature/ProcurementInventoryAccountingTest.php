<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProcurementInventoryAccountingTest extends TestCase
{
    use RefreshDatabase;

    private function setupApi(): array
    {
        $this->seed(DatabaseSeeder::class);
        $company = Company::where('code', 'SOP-DEMO')->firstOrFail();
        $admin = User::where('email', 'admin@sop.local')->firstOrFail();
        $requester = User::where('email', 'rina@sop.local')->firstOrFail();
        $this->actingAs($requester);

        return [$company, $admin, $requester,
            DB::table('products')->where('company_id', $company->id)->first(),
            DB::table('warehouses')->where('company_id', $company->id)->first(),
            DB::table('vendors')->where('company_id', $company->id)->first()];
    }

    public function test_purchase_cycle_receipt_stock_return_and_balanced_journal(): void
    {
        [$co,$manager,$sales,$product,$warehouse,$vendor] = $this->setupApi();
        $before = DB::table('inventory_movements')->where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->sum('quantity');
        $pr = $this->postJson('/api/v1/workflows/purchase-requests', [
            'lines' => [['product_id' => $product->id, 'quantity' => '4.0000', 'unit_price' => '1250.00']],
        ])->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/submit')->assertOk();
        // A requester without procurement authority is rejected before transaction state is disclosed.
        $this->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/order', ['vendor_id' => $vendor->id])->assertForbidden();
        $this->actingAs($manager)->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/decision', ['decision' => 'approved'])->assertOk();
        $po = $this->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/order', ['vendor_id' => $vendor->id])->assertCreated()->json('data');
        $line = DB::table('purchase_order_lines')->where('purchase_order_id', $po['id'])->first();
        $payload = ['warehouse_id' => $warehouse->id, 'received_at' => today()->toDateString(), 'reference' => 'RECEIPT-TEST-01',
            'lines' => [['order_line_id' => $line->id, 'quantity' => '2.0000']]];
        $receipt = $this->postJson('/api/v1/workflows/purchase-orders/'.$po['id'].'/receive', $payload)->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/purchase-orders/'.$po['id'].'/receive', $payload)->assertOk()->assertJsonPath('already_exists', true);
        $this->assertSame('partial', (string) DB::table('purchase_orders')->where('id', $po['id'])->value('status'));
        $receiptLine = DB::table('goods_receipt_lines')->where('goods_receipt_id', $receipt['id'])->firstOrFail();
        $this->postJson('/api/v1/workflows/goods-receipts/'.$receipt['id'].'/return', [
            'receipt_line_id' => $receiptLine->id, 'quantity' => '3.0000', 'reason' => 'Barang tidak sesuai PO'])->assertUnprocessable();
        $this->postJson('/api/v1/workflows/goods-receipts/'.$receipt['id'].'/return', [
            'receipt_line_id' => $receiptLine->id, 'quantity' => '1.0000', 'reason' => 'Barang rusak dari pengiriman'])->assertCreated();
        $after = DB::table('inventory_movements')->where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->sum('quantity');
        $this->assertEquals((float) $before + 1, (float) $after);
        $this->assertSame(1, DB::table('goods_receipts')->where('purchase_order_id', $po['id'])->count());
        $this->getJson('/api/v1/operational/accounting')->assertOk()->assertJsonPath('data.balanced', true);
    }

    public function test_cross_company_cannot_receive_purchase_order(): void
    {
        [$co,$manager] = $this->setupApi();
        $order = DB::table('purchase_orders')->where('company_id', $co->id)->firstOrFail();
        $other = Company::factory()->create();
        $alien = User::factory()->create(['company_id' => $other->id, 'role' => 'manager']);
        $this->actingAs($alien)->postJson('/api/v1/workflows/purchase-orders/'.$order->id.'/receive', [
            'warehouse_id' => (string) DB::table('warehouses')->where('company_id', $co->id)->value('id'),
            'received_at' => today()->toDateString(), 'reference' => 'TEST-CROSS-TENANT',
            'lines' => [['order_line_id' => (string) DB::table('purchase_order_lines')->value('id'), 'quantity' => '1.0000']],
        ])->assertUnprocessable();
    }

    public function test_stock_adjustment_is_idempotent_and_cannot_create_negative_stock(): void
    {
        [$co,$manager,$sales,$product,$warehouse] = $this->setupApi();
        $this->actingAs($manager);
        $payload = ['product_id' => $product->id, 'warehouse_id' => $warehouse->id,
            'quantity' => '1.0000', 'reason' => 'Perhitungan opname QA', 'idempotency_key' => 'stock-adjustment-test-01'];
        $this->postJson('/api/v1/operational/inventory/adjust', $payload)->assertCreated();
        $this->postJson('/api/v1/operational/inventory/adjust', $payload)->assertOk()->assertJsonPath('already_exists', true);
        $payload['idempotency_key'] = 'stock-adjustment-test-02';
        $payload['quantity'] = '-99999.0000';
        $this->postJson('/api/v1/operational/inventory/adjust', $payload)->assertStatus(422);
        $this->assertSame(1, DB::table('inventory_movements')->where('company_id', $co->id)
            ->where('movement_type', 'manual_adjustment')->count());
    }

    public function test_manual_journal_must_balance(): void
    {
        [$co,$manager] = $this->setupApi();
        $this->actingAs($manager);
        $ids = DB::table('chart_of_accounts')->where('company_id', $co->id)->whereIn('code', ['1100', '4100'])->pluck('id', 'code');
        $payload = ['date' => today()->toDateString(), 'description' => 'Journal QA', 'source_id' => (string) Str::ulid(),
            'lines' => [['account_id' => $ids['1100'], 'debit' => '100.00', 'credit' => '0.00'],
                ['account_id' => $ids['4100'], 'debit' => '0.00', 'credit' => '90.00']]];
        $this->postJson('/api/v1/operational/accounting/journal', $payload)->assertUnprocessable();
        $payload['lines'][1]['credit'] = '100.00';
        $this->postJson('/api/v1/operational/accounting/journal', $payload)->assertCreated();
        $this->postJson('/api/v1/operational/accounting/journal', $payload)->assertOk()->assertJsonPath('already_exists', true);
    }

    public function test_manual_journal_options_do_not_leak_another_company_chart(): void
    {
        [$co,$manager] = $this->setupApi();
        $this->actingAs($manager);
        $other = Company::factory()->create();
        $foreignId = (string) Str::ulid();
        DB::table('chart_of_accounts')->insert(['id' => $foreignId, 'company_id' => $other->id, 'code' => '9999', 'name' => 'Hidden', 'type' => 'asset', 'created_at' => now(), 'updated_at' => now()]);
        $accounts = $this->getJson('/api/v1/operational/accounting/options')->assertOk()->json('data.accounts');
        $this->assertNotContains($foreignId, array_column($accounts, 'id'));
    }

    public function test_goods_receipt_can_be_billed_and_paid_as_vendor_ap(): void
    {
        [$co,$manager,,$product,$warehouse,$vendor] = $this->setupApi();
        $this->actingAs($manager);
        $now = now();
        $po = (string) Str::ulid();
        $poLine = (string) Str::ulid();
        $gr = (string) Str::ulid();
        $line = (string) Str::ulid();
        DB::table('purchase_orders')->insert(['id' => $po, 'company_id' => $co->id, 'purchase_request_id' => null, 'vendor_id' => $vendor->id, 'number' => 'PO-AP-TEST', 'status' => 'received', 'total' => '250.00', 'created_at' => $now, 'updated_at' => $now]);
        DB::table('purchase_order_lines')->insert(['id' => $poLine, 'purchase_order_id' => $po, 'product_id' => $product->id, 'quantity' => '2.0000', 'received_quantity' => '2.0000', 'unit_price' => '125.00', 'created_at' => $now, 'updated_at' => $now]);
        DB::table('goods_receipts')->insert(['id' => $gr, 'company_id' => $co->id, 'purchase_order_id' => $po, 'warehouse_id' => $warehouse->id, 'received_by' => $manager->id, 'number' => 'GR-AP-TEST', 'reference' => 'GR-AP-REFERENCE', 'received_at' => today(), 'created_at' => $now, 'updated_at' => $now]);
        DB::table('goods_receipt_lines')->insert(['id' => $line, 'goods_receipt_id' => $gr, 'purchase_order_line_id' => $poLine, 'product_id' => $product->id, 'quantity' => '2.0000', 'unit_cost' => '125.00', 'created_at' => $now, 'updated_at' => $now]);
        $firstBill = ['goods_receipt_id' => $gr, 'lines' => [['goods_receipt_line_id' => $line, 'quantity' => '1.0000']], 'idempotency_key' => 'vendor-bill-test-001'];
        $bill = $this->postJson('/api/v1/operational/payables/bills', $firstBill)->assertCreated()->json('data');
        $this->postJson('/api/v1/operational/payables/bills', $firstBill)->assertOk()->assertJsonPath('already_exists', true);
        $this->assertContains($gr, array_column($this->getJson('/api/v1/operational/payables/options')->assertOk()->json('data.receipts'), 'id'));
        $this->postJson('/api/v1/operational/payables/bills', ['goods_receipt_id' => $gr, 'lines' => [['goods_receipt_line_id' => $line, 'quantity' => '1.0001']], 'idempotency_key' => 'vendor-bill-test-over'])->assertUnprocessable();
        $secondBill = $this->postJson('/api/v1/operational/payables/bills', ['goods_receipt_id' => $gr, 'lines' => [['goods_receipt_line_id' => $line, 'quantity' => '1.0000']], 'idempotency_key' => 'vendor-bill-test-002'])->assertCreated()->json('data');
        $this->assertSame($bill['id'], $secondBill['id']);
        $this->assertDatabaseHas('vendor_bills', ['id' => $bill['id'], 'amount' => '250.00']);
        $this->assertNotContains($gr, array_column($this->getJson('/api/v1/operational/payables/options')->assertOk()->json('data.receipts'), 'id'));
        $this->assertDatabaseHas('journal_entries', ['company_id' => $co->id, 'source_type' => 'vendor_bill', 'source_id' => $bill['id']]);
        $this->assertDatabaseHas('journal_entries', ['company_id' => $co->id, 'source_type' => 'vendor_bill_increment']);
        $this->postJson('/api/v1/workflows/goods-receipts/'.$gr.'/return', ['receipt_line_id' => $line, 'quantity' => '1.0000', 'reason' => 'Barang dikembalikan ke vendor'])->assertCreated();
        $this->assertDatabaseHas('vendor_bills', ['id' => $bill['id'], 'amount' => '125.00', 'status' => 'posted']);
        $this->assertDatabaseHas('vendor_credit_notes', ['vendor_bill_id' => $bill['id'], 'amount' => '125.00', 'status' => 'posted']);
        $this->assertDatabaseHas('journal_entries', ['company_id' => $co->id, 'source_type' => 'purchase_return']);
        $this->postJson('/api/v1/operational/payables/bills/'.$bill['id'].'/payments', ['amount' => '100.00', 'paid_at' => today()->toDateString(), 'idempotency_key' => 'vendor-payment-test-001'])->assertCreated()->assertJsonPath('data.bill.status', 'partial');
        $this->postJson('/api/v1/operational/payables/bills/'.$bill['id'].'/payments', ['amount' => '25.00', 'paid_at' => today()->toDateString(), 'idempotency_key' => 'vendor-payment-test-002'])->assertCreated()->assertJsonPath('data.bill.status', 'paid');
        $this->assertDatabaseHas('journal_entries', ['company_id' => $co->id, 'source_type' => 'vendor_payment']);
        $this->postJson('/api/v1/workflows/goods-receipts/'.$gr.'/return', ['receipt_line_id' => $line, 'quantity' => '1.0000', 'reason' => 'Retur setelah tagihan dibayar'])->assertCreated();
        $this->assertDatabaseHas('vendor_refunds', ['vendor_bill_id' => $bill['id'], 'amount' => '125.00', 'status' => 'posted']);
        $this->assertDatabaseHas('journal_entries', ['company_id' => $co->id, 'source_type' => 'vendor_refund']);
        $this->getJson('/api/v1/operational/payables')->assertOk()->assertJsonPath('data.bills.0.id',$bill['id']);
        $this->getJson('/api/v1/operational/payables')->assertOk()->assertJsonPath('data.credits.0.vendor_bill_id',$bill['id']);
        $this->getJson('/api/v1/operational/payables')->assertOk()->assertJsonPath('data.refunds.0.vendor_bill_id',$bill['id']);
    }
}
