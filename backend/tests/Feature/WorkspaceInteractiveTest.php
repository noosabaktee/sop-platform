<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class WorkspaceInteractiveTest extends TestCase {
    use RefreshDatabase;

    private function setupScenario(): array {
        $this->seed(DatabaseSeeder::class);
        $co = Company::where('code', 'SOP-DEMO')->firstOrFail();
        $user = User::where('email', 'rina@sop.local')->firstOrFail();
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();

        return compact('co', 'user', 'manager');
    }

    public function test_workspace_index_returns_all_nine_dimensions_and_summary_kpi(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $res = $this->getJson('/api/v1/workspace')->assertOk()->json('data');

        $this->assertArrayHasKey('tasks', $res);
        $this->assertArrayHasKey('projects', $res);
        $this->assertArrayHasKey('approvals', $res);
        $this->assertArrayHasKey('activities', $res);
        $this->assertArrayHasKey('calendar', $res);
        $this->assertArrayHasKey('documents', $res);
        $this->assertArrayHasKey('notifications', $res);
        $this->assertArrayHasKey('emails', $res);
        $this->assertArrayHasKey('profile', $res);
        $this->assertArrayHasKey('summary', $res);
        $this->assertArrayHasKey('open_tasks', $res['summary']);
        $this->assertArrayHasKey('pending_approvals', $res['summary']);
        $this->assertArrayHasKey('unread_notifications', $res['summary']);
    }

    public function test_user_can_create_and_toggle_personal_task(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        // 1. Create personal task
        $task = $this->postJson('/api/v1/workspace/tasks', [
            'title' => 'Follow up penawaran PT Maju Mundur',
            'due_at' => now()->addDays(2)->toDateString(),
        ])->assertCreated()->json('data');

        $this->assertEquals('Follow up penawaran PT Maju Mundur', $task['title']);
        $this->assertEquals($data['user']->id, $task['assignee_id']);
        $this->assertEquals('todo', $task['status']);
        $this->assertEquals(0, $task['progress']);

        // 2. Toggle to done
        $toggled = $this->putJson('/api/v1/workspace/tasks/' . $task['id'] . '/toggle')
            ->assertOk()
            ->json('data');

        $this->assertEquals('done', $toggled['status']);
        $this->assertEquals(100, $toggled['progress']);

        // 3. Toggle back to todo
        $untoggled = $this->putJson('/api/v1/workspace/tasks/' . $task['id'] . '/toggle')
            ->assertOk()
            ->json('data');

        $this->assertEquals('todo', $untoggled['status']);
        $this->assertEquals(0, $untoggled['progress']);
    }

    public function test_user_can_create_calendar_event(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $event = $this->postJson('/api/v1/workspace/calendar', [
            'title' => 'Weekly Sales Coordination',
            'starts_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'location' => 'Ruang Meeting 2 / Google Meet',
        ])->assertCreated()->json('data');

        $this->assertEquals('Weekly Sales Coordination', $event['title']);
        $this->assertEquals($data['user']->id, $event['created_by']);

        // Check it appears in workspace calendar
        $ws = $this->getJson('/api/v1/workspace')->assertOk()->json('data');
        $this->assertTrue(collect($ws['calendar'])->contains('title', 'Weekly Sales Coordination'));
    }

    public function test_user_can_mark_notification_as_read(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        // Create an unread notification
        $notifId = (string) \Illuminate\Support\Str::uuid();
        DB::table('notifications')->insert([
            'id' => $notifId,
            'type' => 'App\\Notifications\\QuotationApproved',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id' => $data['user']->id,
            'data' => json_encode(['title' => 'Quotation Disetujui', 'message' => 'Quotation Anda telah disetujui']),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->postJson('/api/v1/workspace/notifications/' . $notifId . '/read')->assertNoContent();

        $readAt = DB::table('notifications')->where('id', $notifId)->value('read_at');
        $this->assertNotNull($readAt);
    }
}
