<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ApprovalDelegationService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** User-scoped operational workspace sourced exclusively from normalized records. */
class WorkspaceController extends Controller {
    private function company(Request $r): string {
        return (string) $r->user()->company_id;
    }

    public function index(Request $r) {
        $user = $r->user();
        $company = $this->company($r);
        ApprovalDelegationService::syncExpiredDelegations($company);

        $delegationScopes = [];
        if (!$user->canManageRecords()) {
            $delegationScopes = DB::table('approval_delegations')
                ->where('company_id', $company)
                ->where('delegatee_id', $user->id)
                ->where('status', 'active')
                ->where('start_date', '<=', now())
                ->where('end_date', '>=', now())
                ->pluck('scope')
                ->toArray();
        }

        $tasks = DB::table('project_tasks as t')
            ->join('projects as p', 'p.id', '=', 't.project_id')
            ->where('p.company_id', $company)
            ->where('t.assignee_id', $user->id)
            ->orderByRaw('t.due_at ASC NULLS LAST')
            ->limit(100)
            ->get(['t.id', 't.title', 't.status', 't.progress', 't.due_at', 'p.name as project', 'p.code as project_code']);

        $projects = DB::table('projects as p')
            ->leftJoin('customers as c', 'c.id', '=', 'p.customer_id')
            ->where('p.company_id', $company)
            ->where('p.manager_id', $user->id)
            ->orderByRaw('p.due_at ASC NULLS LAST')
            ->limit(100)
            ->get([
                'p.id',
                'p.code',
                'p.name',
                'p.status',
                'p.due_at',
                'p.budget',
                'c.name as customer',
                DB::raw("COALESCE((SELECT ROUND(AVG(progress)) FROM project_tasks WHERE project_id=p.id),0) as progress"),
            ]);

        $approvals = DB::table('transaction_approvals as a')
            ->leftJoin('quotations as q', function ($join) {
                $join->on('q.id', '=', 'a.subject_id')->where('a.subject_type', '=', 'quotation');
            })
            ->leftJoin('purchase_requests as pr', function ($join) {
                $join->on('pr.id', '=', 'a.subject_id')->where('a.subject_type', '=', 'purchase_request');
            })
            ->leftJoin('users as u', 'u.id', '=', 'a.requester_id')
            ->leftJoin('users as u_del', 'u_del.id', '=', 'a.delegated_from_id')
            ->where('a.company_id', $company)
            ->where('a.status', 'pending')
            ->when(!$user->canManageRecords(), function ($query) use ($user, $delegationScopes) {
                if (empty($delegationScopes)) {
                    return $query->where('a.requester_id', $user->id);
                }
                return $query->where(function ($sub) use ($user, $delegationScopes) {
                    $sub->where('a.requester_id', $user->id);
                    if (in_array('all', $delegationScopes, true)) {
                        $sub->orWhere('a.status', 'pending');
                    } else {
                        $sub->orWhere(function ($typeSub) use ($delegationScopes) {
                            $typeSub->where('a.status', 'pending')->whereIn('a.subject_type', $delegationScopes);
                        });
                    }
                });
            })
            ->orderBy('a.created_at')
            ->limit(100)
            ->get([
                'a.id',
                'a.subject_type',
                'a.subject_id',
                'a.created_at',
                'a.status',
                'a.tier',
                'a.due_at',
                'a.delegated_from_id',
                'u_del.name as delegated_from_name',
                DB::raw('COALESCE(q.number, pr.number) as number'),
                DB::raw('COALESCE(q.total, pr.estimated_total) as total'),
                'u.name as requester',
            ]);

        $notifications = DB::table('notifications')
            ->where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'type', 'data', 'read_at', 'created_at'])
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'data' => json_decode($n->data, true) ?: [],
                'read_at' => $n->read_at,
                'created_at' => $n->created_at,
            ]);

        $activities = DB::table('audit_events')
            ->where('company_id', $company)
            ->where('actor_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get(['id', 'action', 'entity_type', 'entity_id', 'created_at']);

        $deadlines = DB::table('project_tasks as t')
            ->join('projects as p', 'p.id', '=', 't.project_id')
            ->where('p.company_id', $company)
            ->where('t.assignee_id', $user->id)
            ->whereNotNull('t.due_at')
            ->whereNotIn('t.status', ['done', 'completed'])
            ->select('t.id', 't.title', DB::raw("'Task' as kind"), 't.due_at as starts_at', 'p.name as context', 't.status')
            ->limit(100)
            ->get();

        $meetings = DB::table('corporate_meetings')
            ->where('company_id', $company)
            ->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)->orWhereNull('created_by');
            })
            ->select('id', 'title', DB::raw("'Meeting' as kind"), 'starts_at', 'location as context', 'status')
            ->limit(100)
            ->get();

        $calendar = $deadlines->concat($meetings)->sortBy('starts_at')->values();

        $documents = DB::table('documents')
            ->where('company_id', $company)
            ->where('owner_id', $user->id)
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get(['id', 'title', 'category', 'folder', 'mime_type', 'version', 'status', 'updated_at']);

        $emails = DB::table('outbound_messages')
            ->where('company_id', $company)
            ->where('requested_by', $user->id)
            ->where('channel', 'email')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get(['id', 'subject', 'recipient', 'status', 'sent_at', 'created_at']);

        $companyRow = DB::table('companies')->where('id', $company)->first(['name', 'currency']);
        $profile = [
            ['field' => 'Nama lengkap', 'value' => $user->name, 'visibility' => 'Internal'],
            ['field' => 'Email', 'value' => $user->email, 'visibility' => 'Internal'],
            ['field' => 'Company', 'value' => $companyRow?->name, 'visibility' => 'Internal'],
            ['field' => 'Role', 'value' => $user->role, 'visibility' => 'Restricted'],
            ['field' => 'Mata uang', 'value' => $companyRow?->currency, 'visibility' => 'Internal'],
            ['field' => 'Zona waktu', 'value' => config('app.timezone'), 'visibility' => 'Personal'],
            ['field' => 'Two-factor auth', 'value' => $user->two_factor_confirmed_at ? 'Aktif (Authenticator)' : 'Belum aktif', 'visibility' => 'Restricted'],
        ];

        return response()->json([
            'data' => compact('tasks', 'projects', 'approvals', 'activities', 'calendar', 'documents', 'notifications', 'emails', 'profile') + [
                'summary' => [
                    'open_tasks' => $tasks->whereNotIn('status', ['done', 'completed'])->count(),
                    'managed_projects' => $projects->count(),
                    'pending_approvals' => $approvals->count(),
                    'unread_notifications' => $notifications->whereNull('read_at')->count(),
                ],
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function createTask(Request $r) {
        $co = $this->company($r);
        $data = $r->validate([
            'title' => ['required', 'string', 'min:2', 'max:255'],
            'project_id' => ['nullable', 'ulid', Rule::exists('projects', 'id')->where('company_id', $co)],
            'due_at' => ['nullable', 'date'],
        ]);

        $projectId = $data['project_id'] ?? null;
        if (!$projectId) {
            $projectId = DB::table('projects')->where('company_id', $co)->orderByDesc('created_at')->value('id');
        }

        abort_unless($projectId, 422, 'Belum ada proyek di perusahaan untuk menampung task.');

        return DB::transaction(function () use ($r, $projectId, $data) {
            $id = (string) Str::ulid();
            $now = now();
            DB::table('project_tasks')->insert([
                'id' => $id,
                'project_id' => $projectId,
                'assignee_id' => $r->user()->id,
                'title' => $data['title'],
                'status' => 'todo',
                'progress' => 0,
                'due_at' => $data['due_at'] ?? now()->addDays(3),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record($r->user(), 'workspace.task_created', 'project_task', $id, null, ['title' => $data['title']]);

            return response()->json(['data' => DB::table('project_tasks')->find($id)], 201);
        });
    }

    public function toggleTask(Request $r, string $id) {
        $task = DB::table('project_tasks as t')
            ->join('projects as p', 'p.id', '=', 't.project_id')
            ->where('p.company_id', $this->company($r))
            ->where('t.id', $id)
            ->select('t.*')
            ->first();

        abort_unless($task, 404, 'Task tidak ditemukan.');
        abort_unless($task->assignee_id === $r->user()->id || $r->user()->canManageRecords(), 403);

        $newStatus = in_array($task->status, ['done', 'completed'], true) ? 'todo' : 'done';
        $newProgress = $newStatus === 'done' ? 100 : 0;

        DB::table('project_tasks')->where('id', $id)->update([
            'status' => $newStatus,
            'progress' => $newProgress,
            'updated_at' => now(),
        ]);

        AuditService::record($r->user(), 'workspace.task_toggled', 'project_task', $id, [
            'status' => $task->status,
        ], [
            'status' => $newStatus,
        ]);

        return response()->json(['data' => DB::table('project_tasks')->find($id)]);
    }

    public function createCalendarEvent(Request $r) {
        $co = $this->company($r);
        $data = $r->validate([
            'title' => ['required', 'string', 'min:2', 'max:255'],
            'starts_at' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($r, $co, $data) {
            $id = (string) Str::ulid();
            $now = now();
            DB::table('corporate_meetings')->insert([
                'id' => $id,
                'company_id' => $co,
                'created_by' => $r->user()->id,
                'title' => $data['title'],
                'kind' => 'operational',
                'starts_at' => $data['starts_at'],
                'location' => $data['location'] ?? 'Kantor / Virtual',
                'status' => 'scheduled',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record($r->user(), 'workspace.event_created', 'corporate_meeting', $id, null, ['title' => $data['title']]);

            return response()->json(['data' => DB::table('corporate_meetings')->find($id)], 201);
        });
    }

    public function markRead(Request $r, string $id) {
        $count = DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', $r->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        if (!$count) {
            abort_unless(
                DB::table('notifications')
                    ->where('id', $id)
                    ->where('notifiable_type', 'App\\Models\\User')
                    ->where('notifiable_id', $r->user()->id)
                    ->exists(),
                404
            );
        }

        return response()->noContent();
    }
}
