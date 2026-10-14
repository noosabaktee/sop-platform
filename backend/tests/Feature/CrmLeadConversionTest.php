<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmLeadConversionTest extends TestCase
{
    use RefreshDatabase;

    public function test_saved_lead_is_converted_to_a_linked_prospect_atomically(): void
    {
        $company=Company::factory()->create();
        $user=User::factory()->create(['company_id'=>$company->id,'role'=>'sales','name'=>'Sales Owner']);
        $this->actingAs($user);
        $lead=['__id'=>'leads-new-1','name'=>'Ayu','company'=>'PT Masa Depan','email'=>'ayu@example.test',
            'source'=>'Web','score'=>91,'owner'=>'Sales Owner','status'=>'Qualified'];
        $this->putJson('/api/v1/grid-snapshots',['snapshots'=>[
            ['route'=>'/crm-sales','panel_id'=>'leads','rows'=>[$lead]],
            ['route'=>'/crm-sales','panel_id'=>'prospects','rows'=>[]],
        ]])->assertOk();

        $response=$this->postJson('/api/v1/workflows/crm/leads/leads-new-1/convert')->assertOk()
            ->assertJsonPath('data.snapshots.0.rows',[])
            ->assertJsonPath('data.snapshots.1.rows.0.name','PT Masa Depan');

        $prospectId=$response->json('data.prospect.id');
        $this->assertDatabaseHas('leads',['company_id'=>$company->id,'name'=>'Ayu','status'=>'converted']);
        $this->assertDatabaseHas('prospects',['id'=>$prospectId,'company_id'=>$company->id,'name'=>'PT Masa Depan','fit_score'=>91]);
        $this->assertDatabaseHas('grid_domain_links',['company_id'=>$company->id,'domain_table'=>'prospects','domain_id'=>$prospectId,'archived'=>false]);
        $this->assertDatabaseHas('audit_events',['company_id'=>$company->id,'action'=>'lead.converted','entity_type'=>'lead']);
    }

    public function test_conversion_requires_an_allowed_role(): void
    {
        $company=Company::factory()->create();
        $user=User::factory()->create(['company_id'=>$company->id,'role'=>'auditor']);
        $this->actingAs($user)->postJson('/api/v1/workflows/crm/leads/missing/convert')->assertForbidden();
    }
}
