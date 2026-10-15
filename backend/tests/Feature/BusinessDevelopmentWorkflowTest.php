<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class BusinessDevelopmentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function setupScenario(): array
    {
        $this->seed(DatabaseSeeder::class);
        $co = Company::where('code', 'SOP-DEMO')->firstOrFail();
        $user = User::where('email', 'rina@sop.local')->firstOrFail();
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();

        return compact('co', 'user', 'manager');
    }

    public function test_user_can_list_and_seed_tenders_scoped_to_company(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $res = $this->getJson('/api/v1/operational/bd/tenders')->assertOk()->json('data');

        $this->assertCount(3, $res);
        $names = collect($res)->pluck('name')->all();
        $this->assertContains('TND-44 Data Center', $names);
        $this->assertContains('TND-47 Smart City', $names);
        $this->assertContains('TND-49 ERP Gov', $names);

        $tnd49 = collect($res)->firstWhere('code', 'TND-49');
        $this->assertEquals('Won', $tnd49['status']);
        $this->assertEquals('Pemprov Jabar', $tnd49['client']);
    }

    public function test_user_can_create_and_update_tender_with_audit(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $createRes = $this->postJson('/api/v1/operational/bd/tenders', [
            'name' => 'TND-50 Cloud Migration',
            'client' => 'Kementerian Keuangan',
            'value' => 5500000000,
            'deadline' => '2026-12-15',
            'bid' => 'Bid',
            'status' => 'Submitted',
        ])->assertCreated()->json('data');

        $this->assertEquals('TND-50 Cloud Migration', $createRes['name']);
        $this->assertEquals('Kementerian Keuangan', $createRes['client']);
        $this->assertEquals('Submitted', $createRes['status']);

        $tenderId = $createRes['id'];

        // Update status to Won
        $updateRes = $this->patchJson("/api/v1/operational/bd/tenders/{$tenderId}/status", [
            'status' => 'Won',
        ])->assertOk()->json('data');

        $this->assertEquals('Won', $updateRes['status']);

        // Verify audit log
        $audit = DB::table('audit_events')
            ->where('entity_type', 'crm_tender')
            ->where('entity_id', $tenderId)
            ->where('action', 'tender.status_changed')
            ->first();
        $this->assertNotNull($audit);
    }

    public function test_tender_marked_won_can_be_converted_to_project(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        // Fetch seeded tenders
        $tenders = $this->getJson('/api/v1/operational/bd/tenders')->assertOk()->json('data');
        $wonTender = collect($tenders)->firstWhere('status', 'Won');
        $this->assertNotNull($wonTender);

        $convRes = $this->postJson("/api/v1/operational/bd/tenders/{$wonTender['id']}/project")
            ->assertCreated()
            ->json('data');

        $this->assertNotNull($convRes['id']);
        $this->assertStringStartsWith('PRJ-TND-', $convRes['code']);
        $this->assertEquals($wonTender['name'], $convRes['name']);
        $this->assertEquals($wonTender['id'], $convRes['tender_id']);

        // Verify project is persisted in database
        $projectInDb = DB::table('projects')->where('id', $convRes['id'])->first();
        $this->assertNotNull($projectInDb);
        $this->assertEquals($data['co']->id, $projectInDb->company_id);
        $this->assertEquals($wonTender['id'], $projectInDb->tender_id);

        // Converting again returns already_exists
        $dupRes = $this->postJson("/api/v1/operational/bd/tenders/{$wonTender['id']}/project")->assertOk()->json();
        $this->assertTrue($dupRes['already_exists']);
    }

    public function test_user_can_list_create_and_update_proposals_with_audit(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $res = $this->getJson('/api/v1/operational/bd/proposals')->assertOk()->json('data');
        $this->assertCount(3, $res);

        $createRes = $this->postJson('/api/v1/operational/bd/proposals', [
            'name' => 'PROP-125 Warehouse IoT',
            'client' => 'PT Mitra Logistik',
            'template' => 'ERP Proposal',
            'version' => 'v1',
            'status' => 'Draft',
            'value' => 750000000,
        ])->assertCreated()->json('data');

        $this->assertEquals('PROP-125 Warehouse IoT', $createRes['name']);
        $this->assertEquals('Draft', $createRes['status']);

        $propId = $createRes['id'];

        $updateRes = $this->patchJson("/api/v1/operational/bd/proposals/{$propId}/status", [
            'status' => 'Sent',
        ])->assertOk()->json('data');

        $this->assertEquals('Sent', $updateRes['status']);

        $audit = DB::table('audit_events')
            ->where('entity_type', 'crm_proposal')
            ->where('entity_id', $propId)
            ->where('action', 'proposal.status_changed')
            ->first();
        $this->assertNotNull($audit);
    }

    public function test_accepted_proposal_advances_linked_opportunity_to_won(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        // Create an opportunity
        $cust = DB::table('customers')->where('company_id', $data['co']->id)->first();
        $oppId = (string) Str::ulid();
        DB::table('opportunities')->insert([
            'id' => $oppId,
            'company_id' => $data['co']->id,
            'customer_id' => $cust->id,
            'name' => 'Gov Big Data Platform',
            'amount' => '3500000000.00',
            'stage' => 'proposal',
            'probability' => 60,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create proposal linked to this opportunity
        $prop = $this->postJson('/api/v1/operational/bd/proposals', [
            'name' => 'PROP-Gov Big Data',
            'client' => $cust->name,
            'opportunity_id' => $oppId,
            'template' => 'Tender Proposal',
            'version' => 'v1',
            'status' => 'Draft',
            'value' => 3500000000,
        ])->assertCreated()->json('data');

        // Accept proposal
        $this->patchJson("/api/v1/operational/bd/proposals/{$prop['id']}/status", [
            'status' => 'Accepted',
        ])->assertOk();

        // Opportunity stage should automatically be advanced to won
        $opp = DB::table('opportunities')->where('id', $oppId)->first();
        $this->assertEquals('won', $opp->stage);
    }
}
