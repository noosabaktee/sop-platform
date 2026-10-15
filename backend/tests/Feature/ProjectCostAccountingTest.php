<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProjectCostAccountingTest extends TestCase {
    use RefreshDatabase;

    private function setupScenario(): array {
        $this->seed(DatabaseSeeder::class);
        $co = Company::where('code', 'SOP-DEMO')->firstOrFail();
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();
        $project = DB::table('projects')->where('company_id', $co->id)->firstOrFail();

        return compact('co', 'manager', 'project');
    }

    public function test_project_cost_creation_posts_balanced_double_entry_journal_to_ledger(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['manager']);

        $res = $this->postJson('/api/v1/operational/projects/costs', [
            'project_id' => $data['project']->id,
            'reference' => 'COST-TEST-001',
            'cost_date' => now()->toDateString(),
            'category' => 'material',
            'description' => 'Pembelian semen & pipa fitting',
            'amount' => '7500000.00',
            'payment_method' => 'cash',
            'post_to_ledger' => true,
        ])->assertCreated()->json('data');

        $this->assertNotEmpty($res['journal_entry_id']);
        $this->assertNotEmpty($res['journal_number']);

        // Verify Journal Entry
        $journal = DB::table('journal_entries')->where('id', $res['journal_entry_id'])->first();
        $this->assertNotNull($journal);
        $this->assertEquals('project_cost', $journal->source_type);
        $this->assertEquals($res['id'], $journal->source_id);
        $this->assertEquals('posted', $journal->status);

        // Verify Journal Lines (Debit 5100, Credit 1100)
        $lines = DB::table('journal_lines as jl')
            ->join('chart_of_accounts as coa', 'coa.id', '=', 'jl.account_id')
            ->where('jl.journal_entry_id', $journal->id)
            ->get();

        $this->assertCount(2, $lines);
        $debitLine = $lines->firstWhere('code', '5100');
        $creditLine = $lines->firstWhere('code', '1100');

        $this->assertNotNull($debitLine);
        $this->assertNotNull($creditLine);
        $this->assertEquals('7500000.00', (string) $debitLine->debit);
        $this->assertEquals('0.00', (string) $debitLine->credit);
        $this->assertEquals('0.00', (string) $creditLine->debit);
        $this->assertEquals('7500000.00', (string) $creditLine->credit);
    }

    public function test_project_cost_with_payable_posts_to_accounts_payable(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['manager']);

        $res = $this->postJson('/api/v1/operational/projects/costs', [
            'project_id' => $data['project']->id,
            'reference' => 'COST-TEST-002',
            'cost_date' => now()->toDateString(),
            'category' => 'service',
            'description' => 'Jasa subkontraktor instalasi listrik',
            'amount' => '12000000.00',
            'payment_method' => 'payable',
            'post_to_ledger' => true,
        ])->assertCreated()->json('data');

        $lines = DB::table('journal_lines as jl')
            ->join('chart_of_accounts as coa', 'coa.id', '=', 'jl.account_id')
            ->where('jl.journal_entry_id', $res['journal_entry_id'])
            ->get();

        $creditLine = $lines->firstWhere('code', '2100');
        $this->assertNotNull($creditLine);
        $this->assertEquals('12000000.00', (string) $creditLine->credit);
    }

    public function test_budget_ledger_endpoint_returns_burn_rate_and_variance(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['manager']);

        // Post a cost first
        $this->postJson('/api/v1/operational/projects/costs', [
            'project_id' => $data['project']->id,
            'reference' => 'COST-TEST-003',
            'cost_date' => now()->toDateString(),
            'category' => 'labor',
            'description' => 'Upah mandor mingguan',
            'amount' => '5000000.00',
        ])->assertCreated();

        $budgetRes = $this->getJson('/api/v1/operational/projects/' . $data['project']->id . '/budget-ledger')
            ->assertOk()
            ->json('data');

        $this->assertArrayHasKey('budget', $budgetRes);
        $this->assertArrayHasKey('actual_cost', $budgetRes);
        $this->assertArrayHasKey('variance', $budgetRes);
        $this->assertArrayHasKey('burn_rate_percent', $budgetRes);
        $this->assertArrayHasKey('by_category', $budgetRes);
        $this->assertGreaterThanOrEqual(5000000, $budgetRes['actual_cost']);
    }

    public function test_project_cost_is_blocked_in_closed_accounting_period(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['manager']);

        $closedDate = '2025-01-15';
        DB::table('accounting_periods')->insert([
            'id' => (string) \Illuminate\Support\Str::ulid(),
            'company_id' => $data['co']->id,
            'starts_on' => '2025-01-01',
            'ends_on' => '2025-01-31',
            'status' => 'closed',
            'closed_by' => $data['manager']->id,
            'closed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->postJson('/api/v1/operational/projects/costs', [
            'project_id' => $data['project']->id,
            'reference' => 'COST-TEST-CLOSED',
            'cost_date' => $closedDate,
            'category' => 'expense',
            'description' => 'Biaya di periode tertutup',
            'amount' => '1000000.00',
        ])->assertStatus(409);
    }
}
