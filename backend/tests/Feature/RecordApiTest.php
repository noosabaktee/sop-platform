<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecordApiTest extends TestCase
{
    use RefreshDatabase;

    private function payload(): array
    {
        return ['route' => '/crm-sales', 'view_key' => '0', 'table_index' => 0, 'cells' => ['LEAD-0001', 'PT Contoh'], 'fields' => ['Lead' => 'LEAD-0001', 'Company' => 'PT Contoh']];
    }

    public function test_anonymous_cannot_access_records(): void
    {
        $this->getJson('/api/v1/records?route=/crm-sales&view_key=0&table_index=0')->assertUnauthorized();
    }

    public function test_authenticated_user_can_store_and_read_records(): void
    {
        $co = Company::factory()->create();
        $user = User::factory()->create(['company_id' => $co->id, 'role' => 'admin']);
        $this->actingAs($user);
        $id = $this->postJson('/api/v1/records', $this->payload())->assertCreated()->json('data.id');
        $this->getJson('/api/v1/records?route=/crm-sales&view_key=0&table_index=0')->assertOk()->assertJsonPath('data.0.id', $id);
    }

    public function test_cannot_access_another_company_record(): void
    {
        $one = Company::factory()->create();
        $two = Company::factory()->create();
        $manager = User::factory()->create(['company_id' => $one->id, 'role' => 'admin']);
        $other = User::factory()->create(['company_id' => $two->id, 'role' => 'admin']);
        $this->actingAs($manager);
        $id = $this->postJson('/api/v1/records', $this->payload())->assertCreated()->json('data.id');
        $this->actingAs($other);
        $this->getJson('/api/v1/records/'.$id)->assertForbidden();
        $this->getJson('/api/v1/records?route=/crm-sales&view_key=0&table_index=0')->assertJsonCount(0, 'data');
    }

    public function test_stale_version_returns_conflict(): void
    {
        $co = Company::factory()->create();
        $user = User::factory()->create(['company_id' => $co->id, 'role' => 'admin']);
        $this->actingAs($user);
        $id = $this->postJson('/api/v1/records', $this->payload())->json('data.id');
        $this->putJson('/api/v1/records/'.$id, array_merge($this->payload(), ['version' => 1]))->assertOk();
        $this->putJson('/api/v1/records/'.$id, array_merge($this->payload(), ['version' => 1]))->assertStatus(409);
    }

    public function test_submit_then_approve_requires_manager(): void
    {
        $co = Company::factory()->create();
        $user = User::factory()->create(['company_id' => $co->id, 'role' => 'admin']);
        $this->actingAs($user);
        $id = $this->postJson('/api/v1/records', $this->payload())->json('data.id');
        $this->postJson('/api/v1/records/'.$id.'/transition', ['transition' => 'submit'])->assertOk()->assertJsonPath('data.status', 'pending');
        $this->postJson('/api/v1/records/'.$id.'/transition', ['transition' => 'approve'])->assertOk()->assertJsonPath('data.status', 'approved');
        $this->assertDatabaseHas('audit_events', ['entity_id' => $id, 'action' => 'transition:approve']);
    }
}
