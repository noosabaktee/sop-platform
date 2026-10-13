<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProjectTasksAuditTest extends TestCase {
 use RefreshDatabase;
 public function test_manager_can_add_task_and_assignee_can_complete_it():void{
  $this->seed(DatabaseSeeder::class);
  $manager=User::where('email','admin@sop.local')->firstOrFail();
  $staff=User::where('email','rina@sop.local')->firstOrFail();
  $project=DB::table('projects')->where('company_id',$manager->company_id)->firstOrFail();
  $this->actingAs($manager);
  $task=$this->postJson('/api/v1/operational/projects/'.$project->id.'/tasks',[
   'title'=>'QA task','assignee_id'=>$staff->id,'status'=>'todo'])->assertCreated()->json('data');
  $this->actingAs($staff)->patchJson('/api/v1/operational/project-tasks/'.$task['id'],['status'=>'done'])
   ->assertOk()->assertJsonPath('data.progress',100);
  $this->getJson('/api/v1/security/audit-events')->assertForbidden();
  $this->actingAs($manager)->getJson('/api/v1/security/audit-events')->assertOk();
  $this->assertDatabaseHas('audit_events',['action'=>'project_task.updated','entity_id'=>$task['id']]);
 }
 public function test_cross_company_task_cannot_be_modified():void{
  $this->seed(DatabaseSeeder::class);
  $task=DB::table('project_tasks')->firstOrFail();
  $alien=User::factory()->create(['company_id'=>Company::factory()->create()->id,'role'=>'manager']);
  $this->actingAs($alien)->patchJson('/api/v1/operational/project-tasks/'.$task->id,['status'=>'done'])->assertNotFound();
 }
}
