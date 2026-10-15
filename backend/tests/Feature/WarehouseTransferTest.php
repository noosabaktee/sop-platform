<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class WarehouseTransferTest extends TestCase
{
    use RefreshDatabase;

    private function sample(): array
    {
        $this->seed(DatabaseSeeder::class);
        $company = Company::where('code', 'SOP-DEMO')->firstOrFail();
        $admin = User::where('email', 'admin@sop.local')->firstOrFail();
        $source = DB::table('warehouses')->where('company_id', $company->id)->first();
        $product = DB::table('products')->where('company_id', $company->id)->first();
        $dest = (string) Str::ulid();
        DB::table('warehouses')->insert(['id' => $dest, 'company_id' => $company->id, 'code' => 'WH-DEST',
            'name' => 'Gudang Tujuan QA', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($admin);

        return [$company, $admin, $source, $product, $dest];
    }

    private function stock($company, $product, string $warehouse): float
    {
        return (float) DB::table('inventory_movements')->where('company_id', $company->id)
            ->where('product_id', $product->id)->where('warehouse_id', $warehouse)->sum('quantity');
    }

    public function test_transfer_moves_stock_once_when_received(): void
    {
        [$co,$admin,$from,$product,$to] = $this->sample();
        $initial = $this->stock($co, $product, $from->id);
        $payload = ['product_id' => $product->id, 'from_warehouse_id' => $from->id, 'to_warehouse_id' => $to,
            'quantity' => '2.5000', 'idempotency_key' => 'warehouse-transfer-e2e-01'];
        $created = $this->postJson('/api/v1/operational/inventory/transfers', $payload)->assertCreated()->json('data');
        $id = $created['id'];
        $this->postJson('/api/v1/operational/inventory/transfers', $payload)->assertOk()->assertJsonPath('already_exists', true);
        $modified = $payload;
        $modified['quantity'] = '3.0000';
        $this->postJson('/api/v1/operational/inventory/transfers', $modified)->assertStatus(409);
        $this->assertEquals($initial, $this->stock($co, $product, $from->id));
        $this->postJson('/api/v1/operational/inventory/transfers/'.$id.'/receive')->assertStatus(409);
        $this->postJson('/api/v1/operational/inventory/transfers/'.$id.'/ship')->assertOk()->assertJsonPath('data.status', 'in_transit');
        $this->postJson('/api/v1/operational/inventory/transfers/'.$id.'/ship')->assertOk()->assertJsonPath('already_processed', true);
        $this->assertEquals($initial - 2.5, $this->stock($co, $product, $from->id));
        $this->assertEquals(0, $this->stock($co, $product, $to));
        $this->postJson('/api/v1/operational/inventory/transfers/'.$id.'/receive')->assertOk()->assertJsonPath('data.status', 'received');
        $this->postJson('/api/v1/operational/inventory/transfers/'.$id.'/receive')->assertOk()->assertJsonPath('already_processed', true);
        $this->assertEquals(2.5, $this->stock($co, $product, $to));
        $this->assertEquals($initial, $this->stock($co, $product, $from->id) + $this->stock($co, $product, $to));
        $this->assertSame(2, DB::table('inventory_movements')->where('company_id', $co->id)
            ->where('source_id', $id)->count());
        $this->postJson('/api/v1/operational/inventory/transfers/'.$id.'/cancel')->assertStatus(409);
    }

    public function test_cancel_before_ship_keeps_stock_and_negative_transfer_is_rejected(): void
    {
        [$co,$admin,$from,$product,$to] = $this->sample();
        $base = ['product_id' => $product->id, 'from_warehouse_id' => $from->id, 'to_warehouse_id' => $to,
            'idempotency_key' => 'warehouse-cancel-case-1', 'quantity' => '1.0000'];
        $id = $this->postJson('/api/v1/operational/inventory/transfers', $base)->assertCreated()->json('data.id');
        $this->postJson('/api/v1/operational/inventory/transfers/'.$id.'/cancel')->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->postJson('/api/v1/operational/inventory/transfers/'.$id.'/ship')->assertStatus(409);
        $base['quantity'] = '999999.0000';
        $base['idempotency_key'] = 'warehouse-insufficient-2';
        $bad = $this->postJson('/api/v1/operational/inventory/transfers', $base)->assertCreated()->json('data.id');
        $this->postJson('/api/v1/operational/inventory/transfers/'.$bad.'/ship')->assertUnprocessable();
        $this->assertSame(0, DB::table('inventory_movements')->where('source_id', $bad)->count());
    }

    public function test_cross_company_warehouse_and_without_permission(): void
    {
        [$co,$admin,$from,$product,$to] = $this->sample();
        $other = Company::factory()->create();
        $otherWarehouse = (string) Str::ulid();
        DB::table('warehouses')->insert(['id' => $otherWarehouse, 'company_id' => $other->id,
            'code' => 'WH-ALIEN', 'name' => 'Gudang perusahaan lain', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now()]);
        $input = ['product_id' => $product->id, 'from_warehouse_id' => $from->id, 'to_warehouse_id' => $otherWarehouse,
            'quantity' => '1.0000', 'idempotency_key' => 'warehouse-cross-company-01'];
        $this->postJson('/api/v1/operational/inventory/transfers', $input)->assertUnprocessable();
        $sales = User::where('email','rina@sop.local')->firstOrFail();
        $this->actingAs($sales);
        $input['to_warehouse_id'] = $to;
        $this->postJson('/api/v1/operational/inventory/transfers',$input)->assertForbidden();
    }
}
