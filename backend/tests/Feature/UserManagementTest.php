<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_disabled_user_and_update_user_in_real_database(): void
    {
        $co = Company::factory()->create();
        $admin = User::factory()->create(['company_id' => $co->id, 'role' => 'super_admin']);
        $this->actingAs($admin);
        $result = $this->postJson('/api/v1/admin/users', ['name' => 'SOP Tester', 'email' => 'tester@sop.local', 'role' => 'sales', 'department_name' => 'Sales']);
        $result->assertCreated()->assertJsonPath('data.is_active', false);
        $id = $result->json('data.id');
        $this->assertDatabaseHas('users', ['id' => $id, 'company_id' => $co->id, 'role' => 'sales', 'is_active' => false]);
        $this->patchJson('/api/v1/admin/users/'.$id, ['name' => 'SOP Tester Updated'])->assertOk()->assertJsonPath('data.name', 'SOP Tester Updated');
        $this->deleteJson('/api/v1/admin/users/'.$id)->assertNoContent();
        $this->assertDatabaseHas('users', ['id' => $id, 'is_active' => false]);
    }

    public function test_non_admin_cannot_manage_users(): void
    {
        $co = Company::factory()->create();
        $user = User::factory()->create(['company_id' => $co->id, 'role' => 'user']);
        $this->actingAs($user)->getJson('/api/v1/admin/users')->assertForbidden();
    }

    public function test_admin_cannot_deactivate_self(): void
    {
        $co = Company::factory()->create();
        $admin = User::factory()->create(['company_id' => $co->id, 'role' => 'admin']);
        $this->actingAs($admin)->deleteJson('/api/v1/admin/users/'.$admin->id)->assertStatus(409);
    }
}
