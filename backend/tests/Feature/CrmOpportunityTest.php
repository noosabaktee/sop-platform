<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CrmOpportunityTest extends TestCase {
 use RefreshDatabase;
 public function test_sales_can_create_and_read_own_company_opportunity():void {
  $company=Company::factory()->create();$sales=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);
  $owner=User::factory()->create(['company_id'=>$company->id,'role'=>'manager']);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'CRM-1','name'=>'PT Opportunity']);
  $data=$this->actingAs($sales)->postJson('/api/v1/operational/crm/opportunities',[
   'customer_id'=>$customer->id,'owner_id'=>$owner->id,'name'=>'Implementasi ERP','stage'=>'proposal',
   'amount'=>'125000000.00','probability'=>65])->assertCreated()->json('data');
  $this->getJson('/api/v1/operational/crm/opportunities')->assertOk()
   ->assertJsonPath('data.0.id',$data['id'])->assertJsonPath('data.0.customer','PT Opportunity');
  $this->assertDatabaseHas('audit_events',['company_id'=>$company->id,'action'=>'opportunity.created','entity_id'=>$data['id']]);
 }
 public function test_crm_options_and_opportunities_are_tenant_scoped():void {
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);
  $other=Company::factory()->create();$foreignCustomer=Customer::create(['company_id'=>$other->id,'code'=>'OUT','name'=>'Hidden']);
  $this->actingAs($user)->getJson('/api/v1/operational/crm/options')->assertOk()->assertJsonMissing(['id'=>$foreignCustomer->id]);
  $this->postJson('/api/v1/operational/crm/opportunities',[
   'customer_id'=>$foreignCustomer->id,'name'=>'Blocked','stage'=>'new','amount'=>'1.00','probability'=>1])->assertUnprocessable();
 }
 public function test_customer_360_projects_tenant_customer_revenue_and_open_ar():void {
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'CRM-AR','name'=>'PT Customer 360']);
  DB::table('invoices')->insert(['id'=>(string)Str::ulid(),'company_id'=>$company->id,'customer_id'=>$customer->id,'number'=>'INV-CRM-AR','amount'=>'1000.00','paid_amount'=>'250.00','status'=>'partial','created_at'=>now(),'updated_at'=>now()]);
  $other=Company::factory()->create();$hidden=Customer::create(['company_id'=>$other->id,'code'=>'CRM-HIDE','name'=>'Tidak Boleh Terlihat']);
  DB::table('invoices')->insert(['id'=>(string)Str::ulid(),'company_id'=>$other->id,'customer_id'=>$hidden->id,'number'=>'INV-CRM-HIDE','amount'=>'999999.00','paid_amount'=>'0.00','status'=>'posted','created_at'=>now(),'updated_at'=>now()]);
  $this->actingAs($user)->getJson('/api/v1/operational/crm/customers')->assertOk()->assertJsonFragment(['id'=>$customer->id,'revenue'=>'1000.00','outstanding_ar'=>'750.00'])
   ->assertJsonMissing(['id'=>$hidden->id]);
 }
 public function test_only_owner_or_manager_can_update_opportunity_stage():void {
  $company=Company::factory()->create();$owner=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);
  $peer=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);$manager=User::factory()->create(['company_id'=>$company->id,'role'=>'manager']);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'CRM-2','name'=>'PT Stage']);
  $op=$this->actingAs($owner)->postJson('/api/v1/operational/crm/opportunities',[
   'customer_id'=>$customer->id,'name'=>'Upgrade','stage'=>'new','amount'=>'10.00','probability'=>10])->assertCreated()->json('data');
  $this->actingAs($peer)->patchJson('/api/v1/operational/crm/opportunities/'.$op['id'],['stage'=>'proposal'])->assertForbidden();
  $this->actingAs($manager)->patchJson('/api/v1/operational/crm/opportunities/'.$op['id'],['stage'=>'proposal','probability'=>60])
   ->assertOk()->assertJsonPath('data.stage','proposal')->assertJsonPath('data.probability',60);
  $this->assertDatabaseHas('audit_events',['company_id'=>$company->id,'action'=>'opportunity.updated','entity_id'=>$op['id']]);
 }
 public function test_won_opportunity_converts_once_to_tenant_project():void {
  $company=Company::factory()->create();$sales=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'CRM-3','name'=>'PT Konversi']);
  $op=$this->actingAs($sales)->postJson('/api/v1/operational/crm/opportunities',['customer_id'=>$customer->id,'name'=>'Implementasi tersambung','stage'=>'won','amount'=>'550000.00','probability'=>100,'expected_close'=>today()->addDays(30)->toDateString()])->assertCreated()->json('data');
  $project=$this->postJson('/api/v1/operational/crm/opportunities/'.$op['id'].'/project')->assertCreated()->json('data');
  $this->postJson('/api/v1/operational/crm/opportunities/'.$op['id'].'/project')->assertOk()->assertJsonPath('already_exists',true);
  $this->assertDatabaseHas('projects',['id'=>$project['id'],'opportunity_id'=>$op['id'],'customer_id'=>$customer->id,'manager_id'=>$sales->id,'contract_value'=>'550000.00']);
  $this->assertDatabaseHas('audit_events',['company_id'=>$company->id,'action'=>'opportunity.converted_to_project','entity_id'=>$project['id']]);
 }
 public function test_non_won_or_foreign_opportunity_cannot_be_converted_to_project():void {
  $company=Company::factory()->create();$sales=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'CRM-4','name'=>'PT Belum Menang']);
  $op=$this->actingAs($sales)->postJson('/api/v1/operational/crm/opportunities',['customer_id'=>$customer->id,'name'=>'Belum menang','stage'=>'proposal','amount'=>'100.00','probability'=>50])->assertCreated()->json('data');
  $this->postJson('/api/v1/operational/crm/opportunities/'.$op['id'].'/project')->assertConflict();
  $other=Company::factory()->create();$alien=User::factory()->create(['company_id'=>$other->id,'role'=>'manager']);
  $this->actingAs($alien)->postJson('/api/v1/operational/crm/opportunities/'.$op['id'].'/project')->assertNotFound();
 }
}
