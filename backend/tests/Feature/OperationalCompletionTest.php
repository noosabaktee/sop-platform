<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class OperationalCompletionTest extends TestCase
{
    use RefreshDatabase;

    private function prepare(): User
    {
        $this->seed(DatabaseSeeder::class);
        $u = User::where('email', 'admin@sop.local')->firstOrFail();
        $this->actingAs($u);

        return $u;
    }

    private function stock($co, $p, $w): float
    {
        return (float) DB::table('inventory_movements')->where('company_id', $co)->where('product_id', $p)->where('warehouse_id', $w)->sum('quantity');
    }

    public function test_stocktake_is_idempotent_and_adjusts_only_variance(): void
    {
        $u = $this->prepare();
        $warehouse = DB::table('warehouses')->where('company_id', $u->company_id)->first();
        $stocktake = $this->postJson('/api/v1/operational/inventory/stocktakes', ['warehouse_id' => $warehouse->id])->assertCreated()->json('data.id');
        $lines = $this->getJson('/api/v1/operational/inventory/stocktakes/'.$stocktake)->assertOk()->json('data.lines');
        $this->assertNotEmpty($lines);
        $first = $lines[0];
        $initial = $this->stock($u->company_id, $first['product_id'], $warehouse->id);
        $this->postJson('/api/v1/operational/inventory/stocktakes/'.$stocktake.'/post')->assertUnprocessable();
        foreach ($lines as $i => $line) {
            $qty = (float) $line['expected_qty'] + ($i === 0 ? 2 : 0);
            $this->putJson('/api/v1/operational/inventory/stocktakes/'.$stocktake.'/lines/'.$line['id'], ['counted_qty' => number_format($qty, 4, '.', '')])->assertOk();
        }
        $this->postJson('/api/v1/operational/inventory/stocktakes/'.$stocktake.'/post')->assertOk()->assertJsonPath('adjustments', 1);
        $this->postJson('/api/v1/operational/inventory/stocktakes/'.$stocktake.'/post')->assertOk()->assertJsonPath('already_processed', true);
        $this->assertEquals($initial + 2, $this->stock($u->company_id, $first['product_id'], $warehouse->id));
        $this->assertEquals(1, DB::table('inventory_movements')->where('source_type', 'stocktake')->where('source_id', $stocktake)->count());
    }

    public function test_stocktake_rejects_snapshot_stale_after_stock_movement(): void
    {
        $u = $this->prepare();
        $warehouse = DB::table('warehouses')->where('company_id', $u->company_id)->first();
        $stocktake = $this->postJson('/api/v1/operational/inventory/stocktakes', ['warehouse_id' => $warehouse->id])->assertCreated()->json('data.id');
        $lines = $this->getJson('/api/v1/operational/inventory/stocktakes/'.$stocktake)->json('data.lines');
        foreach ($lines as $line) {
            $this->putJson('/api/v1/operational/inventory/stocktakes/'.$stocktake.'/lines/'.$line['id'], ['counted_qty' => $line['expected_qty']])->assertOk();
        }
        $p = $lines[0]['product_id'];
        $this->postJson('/api/v1/operational/inventory/adjust', [
            'product_id' => $p, 'warehouse_id' => $warehouse->id, 'quantity' => '1.0000', 'reason' => 'Adjustment outside ongoing stocktake',
            'idempotency_key' => 'outside-stocktake-001'])->assertCreated();
        $this->postJson('/api/v1/operational/inventory/stocktakes/'.$stocktake.'/post')->assertStatus(409);
        $this->assertSame(0, DB::table('inventory_movements')->where('source_type', 'stocktake')->count());
    }

    public function test_bank_reconciliation_matches_correct_account_and_amount_once(): void
    {
        $u = $this->prepare();
        $coa = DB::table('chart_of_accounts')->where('company_id', $u->company_id)->where('code', '1200')->first();
        $b = $this->postJson('/api/v1/operational/banks', ['name' => 'Bank Test', 'coa_id' => $coa->id, 'currency' => 'IDR'])->assertCreated()->json('data.id');
        $s = $this->postJson('/api/v1/operational/banks/'.$b.'/statements', [
            'reference' => 'TX-001', 'amount' => '111000000.00', 'value_date' => '2026-10-13'])->assertCreated()->json('data.id');
        $line = DB::table('journal_lines')->where('account_id', $coa->id)->where('debit', '111000000.00')->first();
        $this->assertNotNull($line);
        $this->getJson('/api/v1/operational/bank-statements/'.$s.'/candidates')->assertOk()
            ->assertJsonFragment(['id' => $line->id]);
        $this->postJson('/api/v1/operational/bank-statements/'.$s.'/match', ['journal_line_id' => $line->id])->assertOk();
        $this->postJson('/api/v1/operational/bank-statements/'.$s.'/match', ['journal_line_id' => $line->id])->assertOk()->assertJsonPath('already_exists', true);
        $this->assertSame(1, DB::table('bank_statement_lines')->where('journal_line_id', $line->id)->count());
    }

    public function test_rups_close_requires_minutes_and_resolution_tracks_votes(): void
    {
        $this->prepare();
        $id = $this->postJson('/api/v1/corporate/meetings', [
            'kind' => 'rups_annual', 'title' => 'RUPS QA', 'starts_at' => '2026-10-15 09:00:00',
            'total_shares' => 1000, 'present_shares' => 800])->assertCreated()->json('data.id');
        $this->patchJson('/api/v1/corporate/meetings/'.$id, ['status' => 'held'])->assertStatus(409);
        $this->patchJson('/api/v1/corporate/meetings/'.$id, ['status' => 'scheduled'])->assertOk();
        $this->patchJson('/api/v1/corporate/meetings/'.$id, ['status' => 'held'])->assertOk();
        $this->postJson('/api/v1/corporate/meetings/'.$id.'/resolutions', [
            'title' => 'Approve Annual Statement', 'for_votes' => 700, 'against_votes' => 90, 'abstain_votes' => 20])->assertUnprocessable();
        $this->postJson('/api/v1/corporate/meetings/'.$id.'/resolutions', [
            'title' => 'Approve Annual Statement', 'for_votes' => 700, 'against_votes' => 90, 'abstain_votes' => 10])->assertCreated()->assertJsonPath('data.status', 'approved');
        $this->postJson('/api/v1/corporate/meetings/'.$id.'/close')->assertStatus(409);
        $this->patchJson('/api/v1/corporate/meetings/'.$id, ['minutes' => 'Quorum confirmed; voting recorded.'])->assertOk();
        $this->postJson('/api/v1/corporate/meetings/'.$id.'/close')->assertOk()->assertJsonPath('data.status', 'closed');
        $meeting = DB::table('corporate_meetings')->where('id', $id)->first();
        $this->assertNotNull($meeting->document_id);
        $doc = DB::table('documents')->where('id', $meeting->document_id)->first();
        $this->assertNotNull($doc);
        $this->assertSame('approved', $doc->status);
        $this->assertSame('corporate', $doc->category);
        $v = DB::table('document_versions')->where('document_id', $doc->id)->first();
        $this->assertNotNull($v);
        $this->assertTrue((bool) $v->is_verified);
        $this->assertNotEmpty($v->sha256);
    }

    public function test_reports_are_tenant_scoped_and_provider_send_is_not_faked(): void
    {
        $u = $this->prepare();
        $this->getJson('/api/v1/reports/data?type=sales')->assertOk()->assertJsonCount(6, 'data.rows');
        $response = $this->getJson('/api/v1/reports/export.csv?type=sales')->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->getJson('/api/v1/reports/data?type=tax')->assertOk();
        $this->getJson('/api/v1/reports/export.csv?type=tax')->assertOk();
        $this->getJson('/api/v1/reports/data?type=management')->assertOk();
        $this->getJson('/api/v1/reports/export.csv?type=management')->assertOk();
        $this->getJson('/api/v1/reports/data?type=bd')->assertOk();
        $this->getJson('/api/v1/reports/export.csv?type=bd')->assertOk();
        $this->getJson('/api/v1/integrations/status')->assertOk()->assertJsonPath('data.email', false)->assertJsonPath('data.whatsapp', false)->assertJsonPath('data.ai', false);
        $this->postJson('/api/v1/communications/send', [
            'channel' => 'email', 'recipient' => 'someone@example.com', 'content' => 'Test message should not be delivered',
            'idempotency_key' => 'provider-not-configured-001'])->assertStatus(503);
        $this->postJson('/api/v1/communications/send', [
            'channel' => 'whatsapp', 'recipient' => '+628123456789', 'content' => 'Test WhatsApp should not be delivered',
            'idempotency_key' => 'provider-not-configured-002'])->assertStatus(503);
        $this->assertSame(0, DB::table('outbound_messages')->where('status', 'sent')->count());
    }

    public function test_regular_sales_cannot_post_stocktake_or_bank_match(): void
    {
        $u = $this->prepare();
        $coa = DB::table('chart_of_accounts')->where('company_id', $u->company_id)->where('code', '1200')->firstOrFail();
        $bank = $this->postJson('/api/v1/operational/banks', ['name' => 'Restricted Bank', 'coa_id' => $coa->id, 'currency' => 'IDR'])->assertCreated()->json('data.id');
        $statement = $this->postJson('/api/v1/operational/banks/'.$bank.'/statements', [
            'reference' => 'RESTRICTED-001', 'amount' => '100.00', 'value_date' => '2026-10-13'])->assertCreated()->json('data.id');
        $sales = User::where('email', 'rina@sop.local')->firstOrFail();
        $this->actingAs($sales);
        $w = DB::table('warehouses')->where('company_id', $u->company_id)->first();
        $this->postJson('/api/v1/operational/inventory/stocktakes', ['warehouse_id' => $w->id])->assertForbidden();
        $this->postJson('/api/v1/operational/banks', ['name' => 'No Permission', 'coa_id' => (string) Str::ulid()])->assertForbidden();
        $this->getJson('/api/v1/operational/bank-statements/'.$statement.'/candidates')->assertForbidden();
    }

    public function test_purchase_order_detail_exposes_only_own_company_lines(): void
    {
        $u = $this->prepare();
        $order = DB::table('purchase_orders')->where('company_id', $u->company_id)->firstOrFail();
        $product = DB::table('products')->where('company_id', $u->company_id)->firstOrFail();
        DB::table('purchase_order_lines')->insert(['id' => (string) Str::ulid(), 'purchase_order_id' => $order->id,
            'product_id' => $product->id, 'quantity' => '2.0000', 'received_quantity' => '0.0000', 'unit_price' => '100.00', 'created_at' => now(), 'updated_at' => now()]);
        $this->getJson('/api/v1/operational/procurement/orders/'.$order->id)->assertOk()
            ->assertJsonPath('data.order.id',$order->id)->assertJsonStructure(['data' => ['order', 'lines' => [['id', 'product_id', 'quantity', 'received_quantity']]]]);
        $this->assertGreaterThan(0,DB::table('purchase_order_lines')->where('purchase_order_id',$order->id)->count());
    }
}
