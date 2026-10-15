<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProjectTasksAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_add_task_and_assignee_can_complete_it(): void
    {
        $this->seed(DatabaseSeeder::class);
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();
        $staff = User::where('email', 'rina@sop.local')->firstOrFail();
        $project = DB::table('projects')->where('company_id', $manager->company_id)->firstOrFail();
        $this->actingAs($manager);
        $task = $this->postJson('/api/v1/operational/projects/'.$project->id.'/tasks', [
            'title' => 'QA task', 'assignee_id' => $staff->id, 'status' => 'todo'])->assertCreated()->json('data');
        $this->actingAs($staff)->patchJson('/api/v1/operational/project-tasks/'.$task['id'], ['status' => 'done'])
            ->assertOk()->assertJsonPath('data.progress', 100);
        $this->getJson('/api/v1/security/audit-events')->assertForbidden();
        $this->actingAs($manager)->getJson('/api/v1/security/audit-events')->assertOk();
        $this->assertDatabaseHas('audit_events', ['action' => 'project_task.updated', 'entity_id' => $task['id']]);
    }

    public function test_cross_company_task_cannot_be_modified(): void
    {
        $this->seed(DatabaseSeeder::class);
        $task = DB::table('project_tasks')->firstOrFail();
        $alien = User::factory()->create(['company_id' => Company::factory()->create()->id, 'role' => 'manager']);
        $this->actingAs($alien)->patchJson('/api/v1/operational/project-tasks/'.$task->id, ['status' => 'done'])->assertNotFound();
    }

    public function test_assignment_options_are_limited_to_the_current_company(): void
    {
        $this->seed(DatabaseSeeder::class);
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();
        $alien = User::factory()->create([
            'company_id' => Company::factory()->create()->id,
            'role' => 'staff',
            'is_active' => true,
        ]);
        $data = $this->actingAs($manager)->getJson('/api/v1/operational/projects/options')
            ->assertOk()->json('data.users');
        $this->assertContains($manager->id, array_column($data, 'id'));
        $this->assertNotContains($alien->id, array_column($data, 'id'));
    }

    public function test_manager_can_create_and_update_tenant_project_with_audit(): void
    {
        $this->seed(DatabaseSeeder::class);
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();
        $customer = DB::table('customers')->where('company_id', $manager->company_id)->where('status', 'active')->firstOrFail();
        $project = $this->actingAs($manager)->postJson('/api/v1/operational/projects', [
            'code' => 'PRJ-NATIVE-01', 'name' => 'Implementasi native', 'customer_id' => $customer->id, 'manager_id' => $manager->id,
            'contract_value' => 1200000, 'budget' => 900000,
        ])->assertCreated()->json('data');
        $this->patchJson('/api/v1/operational/projects/'.$project['id'], ['status' => 'active'])
            ->assertOk()->assertJsonPath('data.status', 'active');
        $this->assertDatabaseHas('audit_events', ['action' => 'project.created', 'entity_id' => $project['id']]);
        $this->assertDatabaseHas('audit_events', ['action' => 'project.updated', 'entity_id' => $project['id']]);
    }

    public function test_project_creation_rejects_foreign_customer_and_staff(): void
    {
        $this->seed(DatabaseSeeder::class);
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();
        $foreignCustomer = Customer::create(['company_id' => Company::factory()->create()->id, 'code' => 'FOREIGN-PRJ', 'name' => 'Tenant lain', 'status' => 'active']);
        $this->actingAs($manager)->postJson('/api/v1/operational/projects', ['code' => 'PRJ-X', 'name' => 'Tidak boleh', 'customer_id' => $foreignCustomer->id])
            ->assertUnprocessable();
        $staff = User::where('email', 'rina@sop.local')->firstOrFail();
        $customer = DB::table('customers')->where('company_id', $staff->company_id)->where('status', 'active')->firstOrFail();
        $this->actingAs($staff)->postJson('/api/v1/operational/projects', ['code' => 'PRJ-STAFF', 'name' => 'Tidak boleh', 'customer_id' => $customer->id])
            ->assertForbidden();
    }
}
