<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class QuotationBuilderTest extends TestCase
{
    use RefreshDatabase;

    private function actor(): array
    {
        $company = Company::factory()->create();
        $user = User::factory()->create(['company_id' => $company->id, 'role' => 'sales']);
        $customer = Customer::create(['company_id' => $company->id, 'code' => 'CST-QA', 'name' => 'PT QA Test', 'status' => 'active']);
        $this->actingAs($user);

        return [$user, $customer];
    }

    private function draft(Customer $customer, User $user): array
    {
        return ['customer_id' => $customer->id, 'owner_id' => $user->id, 'contact_name' => 'Andi',
            'payment_terms' => 'NET 30', 'currency' => 'IDR', 'valid_until' => today()->addDays(30)->toDateString(),
            'tax_percent' => 11, 'discount_percent' => 5,
            'items' => [['description' => 'ERP License', 'quantity' => 2, 'unit_price' => '180000000.00'],
                ['description' => 'Implementation Service', 'quantity' => 1, 'unit_price' => '95000000.00']]];
    }

    public function test_draft_is_persisted_with_items_and_server_computed_totals(): void
    {
        [$user,$customer] = $this->actor();
        $data = $this->draft($customer, $user);
        $data['total'] = '0.00'; // Client amount is ignored even when maliciously submitted.
        $result = $this->postJson('/api/v1/quotation-builder/draft', $data)->assertCreated()->json('data');
        $this->assertSame('455000000.00', (string) $result['subtotal']);
        $this->assertSame('22750000.00', (string) $result['discount_total']);
        $this->assertSame('47547500.00', (string) $result['tax']);
        $this->assertSame('479797500.00', (string) $result['total']);
        $this->assertSame(2, DB::table('quotation_items')->where('quotation_id', $result['id'])->count());
        $this->getJson('/api/v1/quotation-builder/list')->assertOk()->assertJsonPath('data.0.number', $result['number']);
        $data['id'] = $result['id'];
        $data['items'][0]['quantity'] = 3;
        $this->postJson('/api/v1/quotation-builder/draft', $data)->assertOk();
        $this->assertSame(2, DB::table('quotation_items')->where('quotation_id', $result['id'])->count());
        $this->assertDatabaseHas('quotations', ['id' => $result['id'], 'version' => 2]);
    }

    public function test_submit_transitions_real_draft_and_blocks_further_direct_edits(): void
    {
        [$user,$customer] = $this->actor();
        $data = $this->draft($customer, $user);
        $draft = $this->postJson('/api/v1/quotation-builder/draft', $data)->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/quotations/'.$draft['id'].'/submit')->assertOk()
            ->assertJsonPath('data.status', 'pending_approval');
        $data['id'] = $draft['id'];
        $this->postJson('/api/v1/quotation-builder/draft', $data)->assertStatus(409);
        $this->assertDatabaseHas('transaction_approvals', ['subject_id' => $draft['id'], 'status' => 'pending']);
    }

    public function test_customer_of_other_company_is_rejected(): void
    {
        [$user,$customer] = $this->actor();
        $other = Company::factory()->create();
        $foreign = Customer::create(['company_id' => $other->id, 'code' => 'OTHER', 'name' => 'Other Company']);
        $data = $this->draft($customer, $user);
        $data['customer_id'] = $foreign->id;
        $this->postJson('/api/v1/quotation-builder/draft', $data)->assertUnprocessable();
        $this->assertDatabaseCount('quotations', 0);
    }

    public function test_stock_product_line_is_tenant_scoped_and_persisted_for_sales_delivery(): void
    {
        [$user,$customer] = $this->actor();
        $product = Product::create(['company_id' => $user->company_id, 'sku' => 'ERP-STOCK', 'name' => 'ERP Appliance', 'standard_cost' => '100.00', 'standard_price' => '250.00', 'is_active' => true]);
        $data = $this->draft($customer, $user);
        $data['items'] = [['product_id' => $product->id, 'description' => $product->name, 'quantity' => 2, 'unit_price' => '250.00']];
        $quote = $this->postJson('/api/v1/quotation-builder/draft', $data)->assertCreated()->json('data');
        $this->assertDatabaseHas('quotation_items', ['quotation_id' => $quote['id'], 'product_id' => $product->id, 'description' => $product->name]);
        $foreign = Product::create(['company_id' => Company::factory()->create()->id, 'sku' => 'FOREIGN', 'name' => 'Foreign', 'standard_cost' => '1.00', 'standard_price' => '1.00', 'is_active' => true]);
        $data['items'][0]['product_id'] = $foreign->id;
        $this->postJson('/api/v1/quotation-builder/draft', $data)->assertUnprocessable();
    }

    public function test_manager_requests_revision_and_sales_can_update_and_resubmit(): void
    {
        [$sales,$customer] = $this->actor();
        $payload = $this->draft($customer, $sales);
        $quote = $this->postJson('/api/v1/quotation-builder/draft', $payload)->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/submit')->assertOk();
        $manager = User::factory()->create(['company_id' => $sales->company_id, 'role' => 'manager']);
        $this->actingAs($manager);
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/decision', [
            'decision' => 'revision_requested', 'comment' => 'Mohon periksa kembali harga',
        ])->assertOk()->assertJsonPath('data.status', 'revision_requested');
        $this->assertDatabaseHas('transaction_approvals', [
            'subject_id' => $quote['id'], 'status' => 'revision_requested', 'comment' => 'Mohon periksa kembali harga',
        ]);
        $this->actingAs($sales);
        $payload['id'] = $quote['id'];
        $payload['items'][0]['quantity'] = 3;
        $this->postJson('/api/v1/quotation-builder/draft', $payload)->assertOk();
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/submit')->assertOk();
        $this->assertDatabaseHas('quotations', ['id' => $quote['id'], 'status' => 'pending_approval']);
        $this->assertSame(2, DB::table('transaction_approvals')->where('subject_id', $quote['id'])->count());
    }

    public function test_rejection_or_revision_requires_a_reason(): void
    {
        [$sales,$customer] = $this->actor();
        $quote = $this->postJson('/api/v1/quotation-builder/draft', $this->draft($customer, $sales))->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/submit')->assertOk();
        $manager = User::factory()->create(['company_id' => $sales->company_id, 'role' => 'manager']);
        $this->actingAs($manager);
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/decision', [
            'decision' => 'rejected',
        ])->assertStatus(422);
        $this->assertDatabaseHas('quotations', ['id' => $quote['id'], 'status' => 'pending_approval']);
    }

    public function test_show_exposes_full_quotation_and_cannot_leak_across_company(): void
    {
        [$sales,$customer] = $this->actor();
        $quote = $this->postJson('/api/v1/quotation-builder/draft', $this->draft($customer, $sales))->assertCreated()->json('data');
        $detail = $this->getJson('/api/v1/quotation-builder/'.$quote['id'])->assertOk()->json('data');
        $this->assertSame($quote['number'], $detail['quotation']['number']);
        $this->assertCount(2, $detail['items']);
        $this->assertSame('PT QA Test', $detail['quotation']['customer_name']);

        $otherCompany = Company::factory()->create();
        $foreignUser = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'sales']);
        $this->actingAs($foreignUser);
        $this->getJson('/api/v1/quotation-builder/'.$quote['id'])->assertStatus(404);
    }

    public function test_document_renders_printable_quotation_with_company_and_items(): void
    {
        [$sales,$customer] = $this->actor();
        $quote = $this->postJson('/api/v1/quotation-builder/draft', $this->draft($customer, $sales))->assertCreated()->json('data');
        $response = $this->get('/api/v1/quotation-builder/'.$quote['id'].'/document')->assertOk();
        $this->assertStringContainsString('text/html', $response->headers->get('Content-Type'));
        $content = $response->getContent();
        $this->assertStringContainsString($quote['number'], $content);
        $this->assertStringContainsString('PT QA Test', $content);
        $this->assertStringContainsString('ERP License', $content);
        $this->assertStringContainsString('479.797.500,00', $content);
    }

    public function test_revise_creates_new_draft_copy_with_items_and_audit(): void
    {
        [$sales,$customer] = $this->actor();
        $quote = $this->postJson('/api/v1/quotation-builder/draft', $this->draft($customer, $sales))->assertCreated()->json('data');
        $revised = $this->postJson('/api/v1/quotation-builder/'.$quote['id'].'/revise')->assertCreated()->json('data');
        $this->assertNotSame($quote['id'], $revised['id']);
        $this->assertNotSame($quote['number'], $revised['number']);
        $this->assertSame('draft', $revised['status']);
        $this->assertSame($quote['total'], $revised['total']);
        $this->assertSame(2, DB::table('quotation_items')->where('quotation_id',$revised['id'])->count());
        $this->assertDatabaseHas('audit_events',[
            'company_id' => $sales->company_id,
            'action' => 'quotation.revised',
            'entity_type' => 'quotation',
            'entity_id' => $revised['id'],
        ]);
    }
}
