<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ApprovalDelegationService;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ApprovalWorkflowController extends Controller
{
    private function company(Request $r): string
    {
        return (string) $r->user()->company_id;
    }

    public function indexDelegations(Request $r)
    {
        $co = $this->company($r);
        ApprovalDelegationService::syncExpiredDelegations($co);

        $delegations = DB::table('approval_delegations as ad')
            ->join('users as u_from', 'u_from.id', '=', 'ad.delegator_id')
            ->join('users as u_to', 'u_to.id', '=', 'ad.delegatee_id')
            ->where('ad.company_id', $co)
            ->select([
                'ad.id',
                'ad.scope',
                'ad.start_date',
                'ad.end_date',
                'ad.reason',
                'ad.status',
                'ad.created_at',
                'u_from.id as delegator_id',
                'u_from.name as delegator_name',
                'u_from.email as delegator_email',
                'u_from.role as delegator_role',
                'u_to.id as delegatee_id',
                'u_to.name as delegatee_name',
                'u_to.email as delegatee_email',
                'u_to.role as delegatee_role',
            ])
            ->orderByDesc('ad.created_at')
            ->get();

        return response()->json(['data' => $delegations]);
    }

    public function storeDelegation(Request $r)
    {
        $co = $this->company($r);
        abort_unless($r->user()->canManageRecords(), 403, 'Hanya approver yang dapat mendelegasikan wewenang.');

        $data = $r->validate([
            'delegatee_id' => [
                'required',
                'ulid',
                Rule::exists('users', 'id')->where('company_id', $co),
            ],
            'scope' => ['required', Rule::in(['all', 'quotation', 'purchase_request'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        abort_if($data['delegatee_id'] === $r->user()->id, 422, 'Tidak dapat mendelegasikan approval ke diri sendiri.');

        $id = (string) Str::ulid();
        $now = now();
        $startDate = Carbon::parse($data['start_date']);
        $endDate = Carbon::parse($data['end_date']);

        $initialStatus = $endDate->isPast() ? 'expired' : 'active';

        DB::table('approval_delegations')->insert([
            'id' => $id,
            'company_id' => $co,
            'delegator_id' => $r->user()->id,
            'delegatee_id' => $data['delegatee_id'],
            'scope' => $data['scope'],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'reason' => $data['reason'] ?? null,
            'status' => $initialStatus,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        AuditService::record($r->user(), 'approval.delegated', 'approval_delegation', $id, null, [
            'delegatee_id' => $data['delegatee_id'],
            'scope' => $data['scope'],
            'start_date' => $startDate->toIso8601String(),
            'end_date' => $endDate->toIso8601String(),
        ]);

        return response()->json(['data' => DB::table('approval_delegations')->find($id)], 201);
    }

    public function revokeDelegation(Request $r, string $id)
    {
        $co = $this->company($r);
        $delegation = DB::table('approval_delegations')
            ->where('company_id', $co)
            ->where('id', $id)
            ->first();

        abort_unless($delegation, 404, 'Delegasi tidak ditemukan.');
        abort_unless(
            $delegation->delegator_id === $r->user()->id || in_array($r->user()->role, ['super_admin', 'admin'], true),
            403,
            'Anda tidak memiliki wewenang untuk mencabut delegasi ini.'
        );

        DB::table('approval_delegations')
            ->where('id', $id)
            ->update([
                'status' => 'revoked',
                'updated_at' => now(),
            ]);

        AuditService::record($r->user(), 'approval.delegation_revoked', 'approval_delegation', $id);

        return response()->json(['data' => DB::table('approval_delegations')->find($id)]);
    }

    public function listEligibleUsers(Request $r)
    {
        $co = $this->company($r);
        $users = DB::table('users')
            ->where('company_id', $co)
            ->where('is_active', true)
            ->where('id', '!=', $r->user()->id)
            ->select(['id', 'name', 'email', 'role'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $users]);
    }

    public function matrix(Request $r)
    {
        $co = $this->company($r);
        ApprovalDelegationService::seedDefaultMatrixIfMissing($co);

        $rules = DB::table('approval_matrices')
            ->where('company_id', $co)
            ->orderBy('level')
            ->orderBy('min_amount')
            ->get();

        return response()->json(['data' => $rules]);
    }

    public function escalations(Request $r)
    {
        $co = $this->company($r);
        $now = now();

        $escalated = DB::table('transaction_approvals as a')
            ->leftJoin('quotations as q', function ($j) {
                $j->on('q.id', '=', 'a.subject_id')->where('a.subject_type', '=', 'quotation');
            })
            ->leftJoin('purchase_requests as pr', function ($j) {
                $j->on('pr.id', '=', 'a.subject_id')->where('a.subject_type', '=', 'purchase_request');
            })
            ->leftJoin('users as u', 'u.id', '=', 'a.requester_id')
            ->where('a.company_id', $co)
            ->where('a.status', 'pending')
            ->where(function ($q) use ($now) {
                $q->where('a.is_escalated', true)
                    ->orWhere(function ($sub) use ($now) {
                        $sub->whereNotNull('a.due_at')->where('a.due_at', '<', $now);
                    });
            })
            ->select([
                'a.id',
                'a.subject_id',
                'a.subject_type',
                'a.status',
                'a.tier',
                'a.due_at',
                'a.created_at',
                DB::raw('COALESCE(q.number, pr.number) as number'),
                DB::raw('COALESCE(q.total, pr.estimated_total) as amount'),
                'u.name as requester_name',
            ])
            ->orderBy('a.due_at')
            ->get();

        return response()->json(['data' => $escalated]);
    }

    public function slaSummary(Request $r)
    {
        $co = $this->company($r);
        $summary = ApprovalDelegationService::calculateSlaSummary($co);

        return response()->json(['data' => $summary]);
    }
}
