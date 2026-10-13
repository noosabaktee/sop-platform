<?php
namespace Tests\Feature;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class GridDomainProjectionTest extends TestCase{
 use RefreshDatabase;
 public function test_master_data_updates_normalized_customers_and_archives_when_deleted():void{
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id,'role'=>'admin']);
  $this->actingAs($user);
  $first=['route'=>'/master-data','panel_id'=>'customers','rows'=>[['__id'=>'customers-1','c0'=>'CUS-777','c1'=>'PT Belajar SOP','c5'=>'Active']]];
  $this->putJson('/api/v1/grid-snapshots',['snapshots'=>[$first]])->assertOk();
  // Explicit native user save goes through the same row-level grid transaction.
  $this->assertDatabaseHas('customers',['company_id'=>$company->id,'code'=>'CUS-777','name'=>'PT Belajar SOP']);
  $changed=$first;$changed['rows'][0]['c1']='PT Belajar SOP Indonesia';$changed['version']=1;
  $this->putJson('/api/v1/grid-snapshots',['snapshots'=>[$changed]])->assertOk();
  $this->assertDatabaseHas('customers',['company_id'=>$company->id,'code'=>'CUS-777','name'=>'PT Belajar SOP Indonesia']);
  $changed['rows']=[];$changed['version']=2;
  $this->putJson('/api/v1/grid-snapshots',['snapshots'=>[$changed]])->assertOk();
  $this->assertDatabaseHas('customers',['company_id'=>$company->id,'code'=>'CUS-777','status'=>'inactive']);
  $this->assertDatabaseHas('grid_domain_links',['company_id'=>$company->id,'archived'=>true]);
 }
 public function test_invalid_master_data_rolls_back_sql_and_grid_snapshot():void{
  $company=Company::factory()->create();$user=User::factory()->create(['company_id'=>$company->id,'role'=>'admin']);$this->actingAs($user);
  $first=['route'=>'/master-data','panel_id'=>'customers','rows'=>[['__id'=>'customers-1','c0'=>'CUS-778','c1'=>'PT Valid','c5'=>'Active']]];
  $this->putJson('/api/v1/grid-snapshots',['snapshots'=>[$first]])->assertOk();
  $first['rows'][0]['c1']='';$first['version']=1;
  $this->putJson('/api/v1/grid-snapshots',['snapshots'=>[$first]])->assertUnprocessable();
  $this->assertDatabaseHas('customers',['company_id'=>$company->id,'code'=>'CUS-778','name'=>'PT Valid']);
  $this->getJson('/api/v1/grid-snapshots')->assertJsonPath('data.0.version',1);
 }
}
