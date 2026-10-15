<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InventoryBatchTrackingTest extends TestCase
{
    use RefreshDatabase;

    private function prepare(): User
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::where('email', 'admin@sop.local')->firstOrFail();
        $this->actingAs($user);

        return $user;
    }

    public function test_goods_receipt_records_batch_and_expiry_and_updates_stock(): void
    {
        $u = $this->prepare();
        $wh = DB::table('warehouses')->where('company_id', $u->company_id)->first();
        $v = DB::table('vendors')->where('company_id', $u->company_id)->first();
        $p = DB::table('products')->where('company_id', $u->company_id)->first();

        // 1. Create PR
        $prId = $this->postJson('/api/v1/workflows/purchase-requests', [
            'lines' => [
                ['product_id' => $p->id, 'quantity' => '100.0000', 'unit_price' => '50000.00'],
            ],
        ])->assertCreated()->json('data.id');

        // 2. Submit & Approve PR
        $this->postJson('/api/v1/workflows/purchase-requests/'.$prId.'/submit')->assertOk();
        $this->postJson('/api/v1/workflows/purchase-requests/'.$prId.'/decision', [
            'decision' => 'approved',
        ])->assertOk();

        // 3. Convert to PO
        $poId = $this->postJson('/api/v1/workflows/purchase-requests/'.$prId.'/order', [
            'vendor_id' => $v->id,
        ])->assertCreated()->json('data.id');

        $poLine = DB::table('purchase_order_lines')->where('purchase_order_id', $poId)->first();

        // 4. Receive Goods with Batch & Expiry
        $batch = 'BATCH-2026-X1';
        $exp = '2027-12-31';
        $gr = $this->postJson('/api/v1/workflows/purchase-orders/'.$poId.'/receive', [
            'warehouse_id' => $wh->id,
            'received_at' => '2026-10-15',
            'reference' => 'GR-BATCH-001',
            'lines' => [
                [
                    'order_line_id' => $poLine->id,
                    'quantity' => '50.0000',
                    'batch_number' => $batch,
                    'expiry_date' => $exp,
                ],
            ],
        ])->assertCreated()->json('data');

        $grLine = DB::table('goods_receipt_lines')->where('goods_receipt_id', $gr['id'])->first();
        $this->assertSame($batch, $grLine->batch_number);
        $this->assertSame($exp, $grLine->expiry_date);

        $mov = DB::table('inventory_movements')->where('source_type', 'goods_receipt_line')->where('source_id', $grLine->id)->first();
        $this->assertNotNull($mov);
        $this->assertSame($batch, $mov->batch_number);
        $this->assertSame($exp, $mov->expiry_date);

        // 5. Check batches endpoint
        $batches = $this->getJson('/api/v1/operational/inventory/batches?product_id='.$p->id)
            ->assertOk()
            ->json('data');
        $this->assertNotEmpty($batches);
        $batchItem = collect($batches)->firstWhere('batch_number', $batch);
        $this->assertNotNull($batchItem);
        $this->assertEquals(50.0, (float) $batchItem['quantity']);
    }

    public function test_sales_delivery_allocates_from_batch_and_guards_batch_balance(): void
    {
        $u = $this->prepare();
        $wh = DB::table('warehouses')->where('company_id', $u->company_id)->first();
        $cust = DB::table('customers')->where('company_id', $u->company_id)->first();
        $p = DB::table('products')->where('company_id', $u->company_id)->first();

        $batch = 'BATCH-ALPHA-99';
        // Inbound stock via manual adjustment with batch
        $this->postJson('/api/v1/operational/inventory/adjust', [
            'product_id' => $p->id,
            'warehouse_id' => $wh->id,
            'quantity' => '20.0000',
            'reason' => 'Initial batch stock',
            'batch_number' => $batch,
            'expiry_date' => '2028-06-30',
            'idempotency_key' => 'adjust-init-batch-99',
        ])->assertCreated();

        // Create Quotation, Submit, Approve, Convert to SO
        $quoteId = $this->postJson('/api/v1/quotation-builder/draft', [
            'customer_id' => $cust->id,
            'owner_id' => $u->id,
            'contact_name' => 'Budi',
            'payment_terms' => 'NET 30',
            'currency' => 'IDR',
            'valid_until' => '2026-12-31',
            'tax_percent' => 11,
            'discount_percent' => 0,
            'items' => [
                [
                    'product_id' => $p->id,
                    'description' => 'Test Batch Product',
                    'quantity' => 15,
                    'unit_price' => '100000.00',
                ],
            ],
        ])->assertCreated()->json('data.id');

        $this->postJson('/api/v1/workflows/quotations/'.$quoteId.'/submit')->assertOk();
        $this->postJson('/api/v1/workflows/quotations/'.$quoteId.'/decision', [
            'decision' => 'approved',
        ])->assertOk();

        $soId = $this->postJson('/api/v1/workflows/quotations/'.$quoteId.'/convert')->assertCreated()->json('data.id');

        // Deliver more than batch balance should fail
        $this->postJson('/api/v1/workflows/sales-orders/'.$soId.'/deliver', [
            'warehouse_id' => $wh->id,
            'idempotency_key' => 'deliv-fail-batch',
            'lines' => [
                [
                    'product_id' => $p->id,
                    'quantity' => '15.0000',
                    'batch_number' => 'NON-EXISTENT-BATCH',
                ],
            ],
        ])->assertStatus(422);

        // Deliver with correct batch
        $this->postJson('/api/v1/workflows/sales-orders/'.$soId.'/deliver', [
            'warehouse_id' => $wh->id,
            'idempotency_key' => 'deliv-success-batch-15',
            'lines' => [
                [
                    'product_id' => $p->id,
                    'quantity' => '15.0000',
                    'batch_number' => $batch,
                ],
            ],
        ])->assertCreated();

        // Check remaining batch balance = 20 - 15 = 5
        $batches = $this->getJson('/api/v1/operational/inventory/batches?product_id='.$p->id)->json('data');
        $batchItem = collect($batches)->firstWhere('batch_number', $batch);
        $this->assertEquals(5.0, (float) $batchItem['quantity']);
    }

    public function test_purchase_return_verifies_and_tracks_batch(): void
    {
        $u = $this->prepare();
        $wh = DB::table('warehouses')->where('company_id', $u->company_id)->first();
        $v = DB::table('vendors')->where('company_id', $u->company_id)->first();
        $p = DB::table('products')->where('company_id', $u->company_id)->first();

        // 1. Create PR -> PO -> GR with batch
        $prId = $this->postJson('/api/v1/workflows/purchase-requests', [
            'lines' => [
                ['product_id' => $p->id, 'quantity' => '10.0000', 'unit_price' => '25000.00'],
            ],
        ])->assertCreated()->json('data.id');
        $this->postJson('/api/v1/workflows/purchase-requests/'.$prId.'/submit')->assertOk();
        $this->postJson('/api/v1/workflows/purchase-requests/'.$prId.'/decision', ['decision' => 'approved'])->assertOk();
        $poId = $this->postJson('/api/v1/workflows/purchase-requests/'.$prId.'/order', ['vendor_id' => $v->id])->assertCreated()->json('data.id');
        $poLine = DB::table('purchase_order_lines')->where('purchase_order_id', $poId)->first();

        $batch = 'RETURN-BATCH-01';
        $gr = $this->postJson('/api/v1/workflows/purchase-orders/'.$poId.'/receive', [
            'warehouse_id' => $wh->id,
            'received_at' => '2026-10-15',
            'reference' => 'GR-RET-BATCH-001',
            'lines' => [
                ['order_line_id' => $poLine->id, 'quantity' => '10.0000', 'batch_number' => $batch],
            ],
        ])->assertCreated()->json('data');

        $grLine = DB::table('goods_receipt_lines')->where('goods_receipt_id', $gr['id'])->first();

        // 2. Return 4 items of this batch
        $ret = $this->postJson('/api/v1/workflows/goods-receipts/'.$gr['id'].'/return', [
            'receipt_line_id' => $grLine->id,
            'quantity' => '4.0000',
            'reason' => 'Defective goods batch test',
        ])->assertCreated();

        // Check return movement has batch
        $retMov = DB::table('inventory_movements')->where('movement_type', 'purchase_return')->first();
        $this->assertNotNull($retMov);
        $this->assertSame($batch, $retMov->batch_number);
        $this->assertEquals(-4.0, (float) $retMov->quantity);

        // Check remaining batch balance = 10 - 4 = 6
        $batches = $this->getJson('/api/v1/operational/inventory/batches?product_id='.$p->id)->json('data');
        $batchItem = collect($batches)->firstWhere('batch_number', $batch);
        $this->assertEquals(6.0, (float) $batchItem['quantity']);
    }
}
