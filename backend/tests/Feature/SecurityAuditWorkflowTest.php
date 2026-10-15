<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use App\Services\AuditService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityAuditWorkflowTest extends TestCase {
    use RefreshDatabase;

    private function prepare(): array {
        $this->seed(DatabaseSeeder::class);
        $admin = User::where('email', 'admin@sop.local')->firstOrFail();
        $staff = User::where('email', 'rina@sop.local')->firstOrFail();
        return [$admin, $staff];
    }

    public function test_audit_log_filters_by_action_and_tenant(): void {
        [$admin, $staff] = $this->prepare();

        $this->actingAs($staff);
        $this->getJson('/api/v1/security/audit-events')->assertForbidden();

        AuditService::record($admin, 'user.security_check', 'user', $admin->id);
        AuditService::record($admin, 'invoice.reviewed', 'invoice', (string)Str::ulid());

        $this->actingAs($admin);
        $resp = $this->getJson('/api/v1/security/audit-events')->assertOk()->json('data');
        $this->assertNotEmpty($resp);
        $this->assertCount(2, $resp);

        // Filter by action
        $filtered = $this->getJson('/api/v1/security/audit-events?action=user.security_check')->assertOk()->json('data');
        $this->assertCount(1, $filtered);
        $this->assertSame('user.security_check', $filtered[0]['action']);
    }

    public function test_login_history_is_recorded_and_scoped(): void {
        [$admin, $staff] = $this->prepare();

        // 1. Successful login
        $this->postJson('/api/login', [
            'email' => 'admin@sop.local',
            'password' => 'ChangeMe-2026!',
        ])->assertOk();

        // 2. Failed login
        $this->postJson('/api/login', [
            'email' => 'admin@sop.local',
            'password' => 'WrongPassword123',
        ])->assertStatus(422);

        // 3. Admin can view login history
        $this->actingAs($admin);
        $history = $this->getJson('/api/v1/security/login-history')->assertOk()->json('data');
        $this->assertNotEmpty($history);
        $this->assertTrue(collect($history)->contains('successful', true));
        $this->assertTrue(collect($history)->contains('successful', false));
    }

    public function test_session_management_and_revocation(): void {
        [$admin] = $this->prepare();
        $this->actingAs($admin);

        // Seed a simulated active session in sessions table
        $now = time();
        $otherSessionId = Str::random(40);
        DB::table('sessions')->insert([
            'id' => $otherSessionId,
            'user_id' => $admin->id,
            'ip_address' => '192.168.1.100',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'payload' => base64_encode(serialize([])),
            'last_activity' => $now - 300,
        ]);

        $sessions = $this->getJson('/api/v1/security/sessions')->assertOk()->json('data');
        $this->assertCount(1, $sessions);
        $this->assertSame($otherSessionId, $sessions[0]['id']);

        // Revoke the session
        $this->deleteJson('/api/v1/security/sessions/' . $otherSessionId)->assertNoContent();
        $this->assertDatabaseMissing('sessions', ['id' => $otherSessionId]);

        // Audit event recorded
        $this->assertDatabaseHas('audit_events', [
            'action' => 'session.revoked',
            'entity_id' => $otherSessionId,
        ]);
    }
}

