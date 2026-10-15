<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Quotation;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class SalesWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function setupWorkflow(): array
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::where('email', 'admin@sop.local')->firstOrFail();
        $this->actingAs($user);
        // Create an unsold quotation: seeder quotations already have Sales Orders.
        $customer = Customer::where('company_id', $user->company_id)->firstOrFail();
        $quotation = Quotation::create(['company_id' => $user->company_id, 'customer_id' => $customer->id, 'owner_id' => $user->id,
            'number' => 'QT-TEST-'.strtoupper((string) Str::ulid()), 'status' => 'draft', 'currency' => 'IDR',
            'subtotal' => '1000.00', 'tax' => '110.00', 'total' => '1110.00', 'valid_until' => today()->addDays(30)]);
        $quotation->items()->create(['description' => 'Service QA', 'quantity' => 1, 'unit_price' => '1000.00',
            'discount' => '0.00', 'line_total' => '1000.00']);

        return [$user, $quotation];
    }

    public function test_approved_quote_converts_to_exactly_one_order_then_invoice_and_reconciles_payments(): void
    {
        [, $q] = $this->setupWorkflow();
        $this->postJson("/api/v1/workflows/quotations/{$q->id}/submit")->assertOk()->assertJsonPath('data.status', 'pending_approval');
        $this->postJson("/api/v1/workflows/quotations/{$q->id}/decision", ['decision' => 'approved'])->assertOk();
        $order = $this->postJson("/api/v1/workflows/quotations/{$q->id}/convert")->assertCreated()->json('data');
        $this->postJson("/api/v1/workflows/quotations/{$q->id}/convert")->assertOk()->assertJsonPath('already_exists', true);
        $this->assertDatabaseCount('transaction_approvals', 1);
        $this->assertDatabaseHas('sales_orders', ['quotation_id' => $q->id, 'id' => $order['id']]);
        $invoice = $this->postJson("/api/v1/workflows/sales-orders/{$order['id']}/invoice")->assertCreated()->json('data');
        $this->postJson("/api/v1/workflows/sales-orders/{$order['id']}/invoice")->assertOk()->assertJsonPath('already_exists', true);
        $amount = (string) $invoice['amount'];
        $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments", ['amount' => '1.00', 'paid_at' => today()->toDateString(), 'idempotency_key' => 'test-payment-01'])->assertCreated()->assertJsonPath('data.invoice.status', 'partial');
        $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments", ['amount' => '1.00', 'paid_at' => today()->toDateString(), 'idempotency_key' => 'test-payment-01'])->assertOk()->assertJsonPath('already_exists', true);
        $balance = (string) number_format(((int) round($amount * 100) - 100) / 100, 2, '.', '');
        $this->postJson("/api/v1/workflows/invoices/{$invoice['id']}/payments", ['amount' => $balance, 'paid_at' => today()->toDateString(), 'idempotency_key' => 'test-payment-02'])->assertCreated()->assertJsonPath('data.invoice.status', 'paid');
        $this->assertDatabaseHas('invoices', ['id' => $invoice['id'], 'status' => 'paid']);
        $this->assertSame(2, DB::table('payments')->where('invoice_id', $invoice['id'])->count());
    }

    public function test_unapproved_quote_cannot_be_converted(): void
    {
        [,$q] = $this->setupWorkflow();
        $this->postJson("/api/v1/workflows/quotations/{$q->id}/convert")->assertStatus(409);
    }

    public function test_users_cannot_operate_on_another_companys_quotation(): void
    {
        [,$q] = $this->setupWorkflow();
        $other = Company::factory()->create();
        $this->actingAs(User::factory()->create(['company_id' => $other->id]));
        $this->postJson("/api/v1/workflows/quotations/{$q->id}/submit")->assertNotFound();
    }

    public function test_confirmed_order_delivery_moves_stock_posts_cogs_and_is_idempotent(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::where('email', 'admin@sop.local')->firstOrFail();
        $this->actingAs($user);
        $order = DB::table('sales_orders')->where('company_id', $user->company_id)->where('status', 'confirmed')->firstOrFail();
        $warehouse = DB::table('warehouses')->where('company_id', $user->company_id)->firstOrFail();
        $before = (string) DB::table('inventory_movements')->where('company_id', $user->company_id)->where('warehouse_id', $warehouse->id)->sum('quantity');
        $delivery = $this->postJson('/api/v1/workflows/sales-orders/'.$order->id.'/deliver', ['warehouse_id' => $warehouse->id, 'idempotency_key' => 'delivery-test-001'])
            ->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/sales-orders/'.$order->id.'/deliver', ['warehouse_id' => $warehouse->id, 'idempotency_key' => 'delivery-test-001'])
            ->assertOk()->assertJsonPath('already_exists', true);
        $this->assertDatabaseHas('sales_deliveries', ['id' => $delivery['id'], 'sales_order_id' => $order->id, 'status' => 'delivered']);
        $this->assertDatabaseHas('sales_orders', ['id' => $order->id, 'status' => 'delivered']);
        $this->assertDatabaseHas('journal_entries', ['company_id' => $user->company_id, 'source_type' => 'sales_delivery', 'source_id' => $delivery['id']]);
        $this->getJson('/api/v1/operational/sales')->assertOk()->assertJsonPath('data.deliveries.0.id', $delivery['id']);
        $after = (string) DB::table('inventory_movements')->where('company_id', $user->company_id)->where('warehouse_id', $warehouse->id)->sum('quantity');
        $this->assertLessThan((float) $before, (float) $after);
        $deliveryLine = DB::table('sales_delivery_lines')->where('sales_delivery_id', $delivery['id'])->firstOrFail();
        $return = $this->postJson('/api/v1/workflows/sales-deliveries/'.$delivery['id'].'/return', ['reason' => 'Barang tidak sesuai pesanan', 'lines' => [['delivery_line_id' => $deliveryLine->id, 'quantity' => '0.5000']], 'idempotency_key' => 'sales-return-test-001'])
            ->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/sales-deliveries/'.$delivery['id'].'/return', ['reason' => 'Barang tidak sesuai pesanan', 'lines' => [['delivery_line_id' => $deliveryLine->id, 'quantity' => '0.5000']], 'idempotency_key' => 'sales-return-test-001'])
            ->assertOk()->assertJsonPath('already_exists', true);
        $this->assertDatabaseHas('sales_returns', ['id' => $return['id'], 'sales_delivery_id' => $delivery['id'], 'status' => 'received']);
        $this->assertDatabaseHas('journal_entries', ['company_id' => $user->company_id, 'source_type' => 'sales_return', 'source_id' => $return['id']]);
        $credit = $this->postJson('/api/v1/workflows/sales-returns/'.$return['id'].'/credit-note')->assertCreated()->json('data.credit_note');
        $this->postJson('/api/v1/workflows/sales-returns/'.$return['id'].'/credit-note')->assertOk()->assertJsonPath('already_exists', true);
        $this->assertDatabaseHas('credit_notes', ['id' => $credit['id'], 'sales_return_id' => $return['id'], 'status' => 'posted']);
        $this->assertDatabaseHas('journal_entries', ['company_id' => $user->company_id, 'source_type' => 'sales_credit_note', 'source_id' => $credit['id']]);
        $this->getJson('/api/v1/operational/sales')->assertOk()->assertJsonPath('data.returns.0.id', $return['id']);
        $this->assertEquals((float) $before - 0.5, (float) DB::table('inventory_movements')->where('company_id', $user->company_id)->where('warehouse_id', $warehouse->id)->sum('quantity'));
        $this->assertSame('partially_returned', DB::table('sales_deliveries')->where('id', $delivery['id'])->value('status'));
        $secondReturn = $this->postJson('/api/v1/workflows/sales-deliveries/'.$delivery['id'].'/return', ['reason' => 'Retur sisa barang yang diterima', 'lines' => [['delivery_line_id' => $deliveryLine->id, 'quantity' => '0.5000']], 'idempotency_key' => 'sales-return-test-002'])->assertCreated()->json('data');
        $this->assertSame((float) $before, (float) DB::table('inventory_movements')->where('company_id', $user->company_id)->where('warehouse_id', $warehouse->id)->sum('quantity'));
        $this->assertSame('returned', DB::table('sales_deliveries')->where('id', $delivery['id'])->value('status'));
        $invoice = DB::table('invoices')->where('sales_order_id', $order->id)->firstOrFail();
        DB::table('invoices')->where('id', $invoice->id)->update(['paid_amount' => $invoice->amount, 'status' => 'paid']);
        $refunded = $this->postJson('/api/v1/workflows/sales-returns/'.$secondReturn['id'].'/credit-note')->assertCreated()->json('data');
        $this->assertNotNull($refunded['refund']);
        $this->assertDatabaseHas('customer_refunds', ['credit_note_id' => $refunded['credit_note']['id'], 'status' => 'posted']);
        $this->assertDatabaseHas('journal_entries', ['company_id' => $user->company_id, 'source_type' => 'customer_refund', 'source_id' => $refunded['refund']['id']]);
        $this->postJson('/api/v1/workflows/sales-deliveries/'.$delivery['id'].'/return', ['reason' => 'Retur melebihi barang delivery', 'lines' => [['delivery_line_id' => $deliveryLine->id, 'quantity' => '0.1000']], 'idempotency_key' => 'sales-return-test-003'])->assertStatus(409);
    }

    public function test_sales_user_and_foreign_warehouse_cannot_create_delivery(): void
    {
        $this->seed(DatabaseSeeder::class);
        $admin = User::where('email', 'admin@sop.local')->firstOrFail();
        $order = DB::table('sales_orders')->where('company_id', $admin->company_id)->where('status', 'confirmed')->firstOrFail();
        $warehouse = DB::table('warehouses')->where('company_id', $admin->company_id)->firstOrFail();
        $sales = User::where('email', 'rina@sop.local')->firstOrFail();
        $this->actingAs($sales)->postJson('/api/v1/workflows/sales-orders/'.$order->id.'/deliver', ['warehouse_id' => $warehouse->id, 'idempotency_key' => 'role-delivery-001'])->assertForbidden();
        $other = Company::factory()->create();
        $foreign = (string) Str::ulid();
        DB::table('warehouses')->insert(['id' => $foreign, 'company_id' => $other->id, 'code' => 'WH-X', 'name' => 'Foreign', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($admin)->postJson('/api/v1/workflows/sales-orders/'.$order->id.'/deliver', ['warehouse_id' => $foreign, 'idempotency_key' => 'tenant-delivery-001'])->assertUnprocessable();
    }

    public function test_sales_order_can_be_delivered_in_multiple_partial_batches(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::where('email', 'admin@sop.local')->firstOrFail();
        $this->actingAs($user);
        $order = DB::table('sales_orders')->where('company_id', $user->company_id)->where('status', 'confirmed')->firstOrFail();
        $warehouse = DB::table('warehouses')->where('company_id', $user->company_id)->firstOrFail();
        $product = DB::table('quotation_items')->where('quotation_id', $order->quotation_id)->whereNotNull('product_id')->firstOrFail();
        $this->postJson('/api/v1/workflows/sales-orders/'.$order->id.'/deliver', ['warehouse_id' => $warehouse->id, 'lines' => [['product_id' => $product->product_id, 'quantity' => '0.5000']], 'idempotency_key' => 'partial-delivery-001'])
            ->assertCreated();
        $this->assertDatabaseHas('sales_orders', ['id' => $order->id, 'status' => 'partial_delivered']);
        $this->getJson('/api/v1/operational/sales/orders/'.$order->id.'/delivery')->assertOk()->assertJsonPath('data.lines.0.delivered_quantity', '0.5000');
        $this->postJson('/api/v1/workflows/sales-orders/'.$order->id.'/deliver', ['warehouse_id' => $warehouse->id, 'lines' => [['product_id' => $product->product_id, 'quantity' => '0.5000']], 'idempotency_key' => 'partial-delivery-002'])
            ->assertCreated();
        $this->assertDatabaseHas('sales_orders',['id' => $order->id, 'status' => 'delivered']);
        $this->assertSame(2,DB::table('sales_deliveries')->where('sales_order_id',$order->id)->count());
    }
}
