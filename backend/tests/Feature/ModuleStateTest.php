<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleStateTest extends TestCase
{
    use RefreshDatabase;

    private function state(string $name, ?int $version = null): array
    {
        $data = ['route' => '/settings', 'section' => 'page', 'payload' => ['USERS' => [['id' => 'u1', 'name' => $name]], 'ROLES' => []]];
        if ($version) {
            $data['version'] = $version;
        }

        return ['states' => [$data]];
    }

    private function admin(): User
    {
        $company = Company::factory()->create();

        return User::factory()->create(['company_id' => $company->id, 'role' => 'super_admin']);
    }

    public function test_module_states_are_authenticated_company_scoped_and_versioned(): void
    {
        $this->getJson('/api/v1/module-states')->assertUnauthorized();
        $admin = $this->admin();
        $this->actingAs($admin);
        $this->putJson('/api/v1/module-states', $this->state('Initial'))->assertOk()->assertJsonPath('data.0.version', 1);
        $this->putJson('/api/v1/module-states', $this->state('Updated', 1))->assertOk()->assertJsonPath('data.0.version', 2);
        $this->getJson('/api/v1/module-states')->assertJsonPath('data.0.payload.USERS.0.name', 'Updated');
        $this->putJson('/api/v1/module-states', $this->state('Stale', 1))->assertStatus(409);
        $this->assertDatabaseHas('module_states', ['company_id' => $admin->company_id, 'version' => 2]);
    }

    public function test_seed_does_not_overwrite_existing_data(): void
    {
        $this->actingAs($this->admin());
        $this->putJson('/api/v1/module-states', $this->state('Saved'))->assertOk();
        $this->putJson('/api/v1/module-states', array_merge($this->state('Fake'), ['seed_only' => true]))->assertOk();
        $this->getJson('/api/v1/module-states')->assertJsonPath('data.0.payload.USERS.0.name', 'Saved');
    }

    public function test_different_companies_cannot_read_or_replace_each_others_data(): void
    {
        $one = $this->admin();
        $two = $this->admin();
        $this->actingAs($one)->putJson('/api/v1/module-states', $this->state('Private'))->assertOk();
        $this->actingAs($two)->getJson('/api/v1/module-states')->assertJsonCount(0, 'data');
        $this->actingAs($two)->putJson('/api/v1/module-states', $this->state('Other'))->assertOk();
        $this->actingAs($one)->getJson('/api/v1/module-states')->assertJsonPath('data.0.payload.USERS.0.name', 'Private');
    }

    public function test_non_admin_cannot_modify_privileged_modules(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create(['company_id' => $admin->company_id, 'role' => 'user']);
        $this->actingAs($admin)->putJson('/api/v1/module-states', $this->state('Admin'))->assertOk();
        $this->actingAs($user)->getJson('/api/v1/module-states')->assertJsonCount(0, 'data');
        $this->putJson('/api/v1/module-states', $this->state('Overwritten', 1))->assertForbidden();
    }

    public function test_unknown_routes_are_rejected(): void
    {
        $this->actingAs($this->admin());
        $bad = $this->state('Wrong');
        $bad['states'][0]['route'] = '/unlisted';
        $this->putJson('/api/v1/module-states',$bad)->assertUnprocessable();
    }
}
