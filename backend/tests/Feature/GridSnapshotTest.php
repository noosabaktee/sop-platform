<?php
namespace Tests\Feature;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GridSnapshotTest extends TestCase {
    use RefreshDatabase;
    private function payload(string $name,?int $version=null):array {
        $record=['route'=>'/crm-sales','panel_id'=>'leads',
            'rows'=>[['__id'=>'leads-1','name'=>$name,'status'=>'New']]];
        if($version!==null)$record['version']=$version;
        return ['snapshots'=>[$record]];
    }
    private function signIn():void {
        $company=Company::factory()->create();
        $user=User::factory()->create(['company_id'=>$company->id]);
        $this->actingAs($user);
    }
    public function test_anonymous_cannot_read_grid_snapshots():void {
        $this->getJson('/api/v1/grid-snapshots')->assertUnauthorized();
    }
    public function test_real_row_create_update_delete_and_reload():void {
        $this->signIn();
        $this->putJson('/api/v1/grid-snapshots',$this->payload('Initial'))->assertOk();
        $this->assertDatabaseHas('grid_rows',['row_key'=>'leads-1']);
        $this->putJson('/api/v1/grid-snapshots',$this->payload('Updated',1))->assertOk();
        $this->getJson('/api/v1/grid-snapshots')->assertOk()
            ->assertJsonPath('data.0.rows.0.name','Updated')
            ->assertJsonPath('data.0.version',2);
        $this->assertDatabaseHas('audit_events',['action'=>'grid.row.updated']);
        $this->putJson('/api/v1/grid-snapshots',['snapshots'=>[['route'=>'/crm-sales',
            'panel_id'=>'leads','rows'=>[],'version'=>2]]])->assertOk();
        $this->getJson('/api/v1/grid-snapshots')->assertJsonPath('data.0.rows',[]);
        $this->assertSoftDeleted('grid_rows',['row_key'=>'leads-1']);
    }
    public function test_concurrent_edits_cannot_overwrite_changes():void {
        $this->signIn();
        $this->putJson('/api/v1/grid-snapshots',$this->payload('First'))->assertOk();
        $this->putJson('/api/v1/grid-snapshots',$this->payload('Second',1))->assertOk();
        $this->putJson('/api/v1/grid-snapshots',$this->payload('Stale',1))->assertStatus(409);
        $this->getJson('/api/v1/grid-snapshots')->assertJsonPath('data.0.rows.0.name','Second');
    }
    public function test_seed_never_overwrites_user_changes():void {
        $this->signIn();
        $this->putJson('/api/v1/grid-snapshots',$this->payload('Original'))->assertOk();
        $this->putJson('/api/v1/grid-snapshots',array_merge($this->payload('Fake'),['seed_only'=>true]))->assertOk();
        $this->getJson('/api/v1/grid-snapshots')->assertJsonPath('data.0.rows.0.name','Original');
    }
    public function test_tenant_isolation():void {
        $a=Company::factory()->create();$b=Company::factory()->create();
        $one=User::factory()->create(['company_id'=>$a->id]);
        $two=User::factory()->create(['company_id'=>$b->id]);
        $this->actingAs($one)->putJson('/api/v1/grid-snapshots',$this->payload('Secret'))->assertOk();
        $this->actingAs($two)->getJson('/api/v1/grid-snapshots')->assertOk()->assertJsonCount(0,'data');
    }
    public function test_duplicate_row_ids_rejected():void {
        $this->signIn();
        $record=$this->payload('A');$record['snapshots'][0]['rows'][]=['__id'=>'leads-1','name'=>'B'];
        $this->putJson('/api/v1/grid-snapshots',$record)->assertUnprocessable();
    }
}
