<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ApprovalDelegationAndWorkflowTest extends TestCase {
    use RefreshDatabase;

    private function setupScenario(): array {
        $this->seed(DatabaseSeeder::class);
        $co = Company::where('code', 'SOP-DEMO')->firstOrFail();
        $manager = User::where('email', 'bagus@sop.local')->firstOrFail();
        $salesRina = User::where('email', 'rina@sop.local')->firstOrFail();
        $financeSari = User::where('email', 'sari@sop.local')->firstOrFail();
        $admin = User::where('email', 'admin@sop.local')->firstOrFail();
        $product = DB::table('products')->where('company_id', $co->id)->firstOrFail();
        $customer = DB::table('customers')->where('company_id', $co->id)->firstOrFail();

        return compact('co', 'manager', 'salesRina', 'financeSari', 'admin', 'product', 'customer');
    }

    public function test_manager_can_create_delegation_to_staff(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['manager']);

        // Eligible users list
        $usersRes = $this->getJson('/api/v1/approvals/users')->assertOk()->json('data');
        $this->assertNotEmpty($usersRes);
        $this->assertTrue(collect($usersRes)->contains('id', $data['salesRina']->id));

        // Create delegation
        $delegation = $this->postJson('/api/v1/approvals/delegations', [
            'delegatee_id' => $data['salesRina']->id,
            'scope' => 'all',
            'start_date' => now()->subHour()->toDateTimeString(),
            'end_date' => now()->addDays(7)->toDateTimeString(),
            'reason' => 'Cuti tahunan manager',
        ])->assertCreated()->json('data');

        $this->assertEquals('active', $delegation['status']);
        $this->assertEquals($data['manager']->id, $delegation['delegator_id']);
        $this->assertEquals($data['salesRina']->id, $delegation['delegatee_id']);

        // Check index delegations
        $list = $this->getJson('/api/v1/approvals/delegations')->assertOk()->json('data');
        $this->assertCount(1, $list);
        $this->assertEquals($data['manager']->name, $list[0]['delegator_name']);
        $this->assertEquals($data['salesRina']->name, $list[0]['delegatee_name']);
    }

    public function test_non_approver_cannot_create_delegation(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['salesRina']);

        $this->postJson('/api/v1/approvals/delegations', [
            'delegatee_id' => $data['financeSari']->id,
            'scope' => 'all',
            'start_date' => now()->toDateTimeString(),
            'end_date' => now()->addDays(2)->toDateTimeString(),
        ])->assertForbidden();
    }

    public function test_delegated_staff_can_approve_quotation_and_records_delegation_trace(): void {
        $data = $this->setupScenario();

        // Admin submits quotation
        $this->actingAs($data['admin']);
        $q = $this->postJson('/api/v1/quotation-builder/draft', [
            'customer_id' => $data['customer']->id,
            'owner_id' => $data['admin']->id,
            'currency' => 'IDR',
            'valid_until' => today()->addDays(30)->toDateString(),
            'tax_percent' => 11,
            'discount_percent' => 0,
            'items' => [
                ['description' => 'Product License', 'product_id' => $data['product']->id, 'quantity' => 10, 'unit_price' => '150000.00']
            ]
        ])->assertCreated()->json('data');

        $submitRes = $this->postJson('/api/v1/workflows/quotations/' . $q['id'] . '/submit')->assertOk()->json('data');
        $this->assertArrayHasKey('tier', $submitRes);
        $this->assertArrayHasKey('due_at', $submitRes);

        // Before delegation: salesRina cannot approve (403)
        $this->actingAs($data['salesRina']);
        $this->postJson('/api/v1/workflows/quotations/' . $q['id'] . '/decision', [
            'decision' => 'approved'
        ])->assertForbidden();

        // Manager delegates quotation approval to salesRina
        $this->actingAs($data['manager']);
        $this->postJson('/api/v1/approvals/delegations', [
            'delegatee_id' => $data['salesRina']->id,
            'scope' => 'quotation',
            'start_date' => now()->subMinutes(10)->toDateTimeString(),
            'end_date' => now()->addDays(3)->toDateTimeString(),
            'reason' => 'Delegasi penandatanganan',
        ])->assertCreated();

        // Now salesRina sees quotation in approvals list
        $this->actingAs($data['salesRina']);
        $approvalsList = $this->getJson('/api/v1/workflows/transaction-approvals')->assertOk()->json('data');
        $this->assertTrue(collect($approvalsList)->contains('subject_id', $q['id']));

        // salesRina approves successfully!
        $decideRes = $this->postJson('/api/v1/workflows/quotations/' . $q['id'] . '/decision', [
            'decision' => 'approved'
        ])->assertOk()->json('data');

        $this->assertEquals('approved', $decideRes['status']);
        $this->assertEquals($data['manager']->id, $decideRes['delegated_from_id']);

        // Verify DB record
        $ap = DB::table('transaction_approvals')->where('subject_id', $q['id'])->first();
        $this->assertEquals('approved', $ap->status);
        $this->assertEquals($data['salesRina']->id, $ap->approver_id);
        $this->assertEquals($data['manager']->id, $ap->delegated_from_id);
    }

    public function test_delegated_staff_can_approve_purchase_request(): void {
        $data = $this->setupScenario();

        // Admin submits PR
        $this->actingAs($data['admin']);
        $pr = $this->postJson('/api/v1/workflows/purchase-requests', [
            'lines' => [
                ['product_id' => $data['product']->id, 'quantity' => '5.0000', 'unit_price' => '200000.00']
            ]
        ])->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/purchase-requests/' . $pr['id'] . '/submit')->assertOk();

        // Manager delegates PR approval to salesRina
        $this->actingAs($data['manager']);
        $this->postJson('/api/v1/approvals/delegations', [
            'delegatee_id' => $data['salesRina']->id,
            'scope' => 'purchase_request',
            'start_date' => now()->subMinutes(5)->toDateTimeString(),
            'end_date' => now()->addDays(1)->toDateTimeString(),
        ])->assertCreated();

        // salesRina approves PR
        $this->actingAs($data['salesRina']);
        $this->postJson('/api/v1/workflows/purchase-requests/' . $pr['id'] . '/decision', [
            'decision' => 'approved'
        ])->assertOk();

        $ap = DB::table('transaction_approvals')->where('subject_id', $pr['id'])->first();
        $this->assertEquals('approved', $ap->status);
        $this->assertEquals($data['salesRina']->id, $ap->approver_id);
        $this->assertEquals($data['manager']->id, $ap->delegated_from_id);
    }

    public function test_revoked_delegation_cannot_approve(): void {
        $data = $this->setupScenario();

        // Manager delegates to salesRina
        $this->actingAs($data['manager']);
        $del = $this->postJson('/api/v1/approvals/delegations', [
            'delegatee_id' => $data['salesRina']->id,
            'scope' => 'all',
            'start_date' => now()->subMinutes(5)->toDateTimeString(),
            'end_date' => now()->addDays(1)->toDateTimeString(),
        ])->assertCreated()->json('data');

        // Revoke delegation
        $this->postJson('/api/v1/approvals/delegations/' . $del['id'] . '/revoke')->assertOk();
        $this->assertEquals('revoked', DB::table('approval_delegations')->where('id', $del['id'])->value('status'));

        // Admin submits PR
        $this->actingAs($data['admin']);
        $pr = $this->postJson('/api/v1/workflows/purchase-requests', [
            'lines' => [
                ['product_id' => $data['product']->id, 'quantity' => '1.0000', 'unit_price' => '50000.00']
            ]
        ])->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/purchase-requests/' . $pr['id'] . '/submit')->assertOk();

        // salesRina attempts to approve with revoked delegation -> 403 Forbidden
        $this->actingAs($data['salesRina']);
        $this->postJson('/api/v1/workflows/purchase-requests/' . $pr['id'] . '/decision', [
            'decision' => 'approved'
        ])->assertForbidden();
    }

    public function test_matrix_and_sla_summary_endpoints(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['manager']);

        // Matrix endpoint
        $matrixRes = $this->getJson('/api/v1/approvals/matrix')->assertOk()->json('data');
        $this->assertNotEmpty($matrixRes);
        $this->assertGreaterThanOrEqual(4, count($matrixRes));

        // SLA summary endpoint
        $slaRes = $this->getJson('/api/v1/approvals/sla-summary')->assertOk()->json('data');
        $this->assertArrayHasKey('total_pending', $slaRes);
        $this->assertArrayHasKey('compliance_percentage', $slaRes);
        $this->assertArrayHasKey('approved_this_week', $slaRes);

        // Escalations endpoint
        $escRes = $this->getJson('/api/v1/approvals/escalations')->assertOk()->json('data');
        $this->assertIsArray($escRes);
    }
}

