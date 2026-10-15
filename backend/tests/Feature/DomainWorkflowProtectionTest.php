<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/** Direct generic CRUD must not bypass approval/stock/accounting workflows. */
class DomainWorkflowProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_mutation_of_financial_transaction_domains_cannot_bypass_workflow(): void
    {
        $this->seed(DatabaseSeeder::class);
        $admin = User::where('email', 'admin@sop.local')->firstOrFail();
        $this->actingAs($admin);
        foreach (['quotations', 'sales-orders', 'invoices', 'purchase-requests', 'purchase-orders', 'inventory-movements'] as $domain) {
            $this->postJson('/api/v1/domains/'.$domain, ['number' => 'BYPASS-001'])->assertStatus(405);
            $this->putJson('/api/v1/domains/'.$domain.'/'.(string) Str::ulid(), ['status' => 'paid'])->assertStatus(405);
            $this->deleteJson('/api/v1/domains/'.$domain.'/'.(string) Str::ulid())->assertStatus(405);
        }
    }

    public function test_vendor_master_data_writes_are_role_restricted(): void
    {
        $this->seed(DatabaseSeeder::class);
        $admin = User::where('email', 'admin@sop.local')->firstOrFail();
        $sales = User::where('email', 'rina@sop.local')->firstOrFail();
        $payload = ['code' => 'VEND-ROLE-001', 'name' => 'QA Vendor'];
        $this->actingAs($sales)->postJson('/api/v1/domains/vendors', $payload)->assertForbidden();
        $this->actingAs($admin)->postJson('/api/v1/domains/vendors', $payload)->assertCreated()
            ->assertJsonPath('data.code', 'VEND-ROLE-001');
    }
}
