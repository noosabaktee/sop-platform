<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApprovalDelegationService
{
    public static function isAuthorizedApprover(User $user, string $subjectType, string $companyId, ?string &$delegatedFromId = null): bool
    {
        if ($user->canManageRecords()) {
            return true;
        }

        self::syncExpiredDelegations($companyId);
        $now = now();
        $delegation = DB::table('approval_delegations')
            ->where('company_id', $companyId)
            ->where('delegatee_id', $user->id)
            ->where('status', 'active')
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->whereIn('scope', ['all', $subjectType])
            ->first();

        if ($delegation) {
            $delegator = DB::table('users')
                ->where('id', $delegation->delegator_id)
                ->where('company_id', $companyId)
                ->first();

            if ($delegator && in_array($delegator->role, ['super_admin', 'admin', 'manager'], true)) {
                $delegatedFromId = $delegation->delegator_id;

                return true;
            }
        }

        return false;
    }

    public static function syncExpiredDelegations(string $companyId): void
    {
        DB::table('approval_delegations')
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->where('end_date', '<', now())
            ->update([
                'status' => 'expired',
                'updated_at' => now(),
            ]);
    }

    public static function seedDefaultMatrixIfMissing(string $companyId): void
    {
        $exists = DB::table('approval_matrices')->where('company_id', $companyId)->exists();
        if ($exists) {
            return;
        }

        $now = now();
        $defaults = [
            [
                'id' => (string) Str::ulid(),
                'company_id' => $companyId,
                'subject_type' => 'all',
                'condition_label' => 'Kurang dari Rp 50 jt',
                'min_amount' => 0,
                'max_amount' => 50000000,
                'required_role' => 'Supervisor',
                'level' => 1,
                'sla_hours' => 24,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::ulid(),
                'company_id' => $companyId,
                'subject_type' => 'all',
                'condition_label' => 'Rp 50 jt – Rp 250 jt',
                'min_amount' => 50000000.0001,
                'max_amount' => 250000000,
                'required_role' => 'Manager',
                'level' => 1,
                'sla_hours' => 24,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::ulid(),
                'company_id' => $companyId,
                'subject_type' => 'all',
                'condition_label' => 'Rp 250 jt – Rp 1 M',
                'min_amount' => 250000000.0001,
                'max_amount' => 1000000000,
                'required_role' => 'Manager → Direktur',
                'level' => 2,
                'sla_hours' => 48,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::ulid(),
                'company_id' => $companyId,
                'subject_type' => 'all',
                'condition_label' => 'Lebih dari Rp 1 M',
                'min_amount' => 1000000000.0001,
                'max_amount' => null,
                'required_role' => 'Manager → Direktur → Komisaris',
                'level' => 3,
                'sla_hours' => 72,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('approval_matrices')->insert($defaults);
    }

    public static function evaluateMatrix(string $companyId, string $subjectType, float $amount): array
    {
        self::seedDefaultMatrixIfMissing($companyId);

        $rule = DB::table('approval_matrices')
            ->where('company_id', $companyId)
            ->whereIn('subject_type', ['all', $subjectType])
            ->where('min_amount', '<=', $amount)
            ->where(function ($q) use ($amount) {
                $q->whereNull('max_amount')->orWhere('max_amount', '>=', $amount);
            })
            ->orderByDesc('level')
            ->first();

        if ($rule) {
            return [
                'level' => (int) $rule->level,
                'sla_hours' => (int) $rule->sla_hours,
                'required_role' => $rule->required_role,
                'condition_label' => $rule->condition_label,
            ];
        }

        return [
            'level' => 1,
            'sla_hours' => 24,
            'required_role' => 'Manager',
            'condition_label' => 'Standar',
        ];
    }

    public static function calculateSlaSummary(string $companyId): array
    {
        $now = now();
        $approvals = DB::table('transaction_approvals')
            ->where('company_id', $companyId)
            ->get();

        $pending = $approvals->where('status', 'pending');
        $totalPending = $pending->count();

        $approachingSla = 0;
        $breachedSla = 0;

        foreach ($pending as $p) {
            if ($p->due_at) {
                $due = Carbon::parse($p->due_at);
                if ($now->greaterThan($due)) {
                    $breachedSla++;
                } elseif ($now->diffInHours($due, false) <= 4) {
                    $approachingSla++;
                }
            }
        }

        $decidedRecently = $approvals->filter(function ($p) use ($now) {
            return in_array($p->status, ['approved', 'rejected'], true) &&
                $p->decided_at &&
                Carbon::parse($p->decided_at)->greaterThanOrEqualTo($now->copy()->subDays(30));
        });

        $totalDecided = $decidedRecently->count();
        $onTimeDecided = $decidedRecently->filter(function ($p) {
            if (! $p->due_at || ! $p->decided_at) {
                return true;
            }

            return Carbon::parse($p->decided_at)->lessThanOrEqualTo(Carbon::parse($p->due_at));
        })->count();

        $complianceRate = $totalDecided > 0
            ? round(($onTimeDecided / $totalDecided) * 100, 1)
            : ($totalPending > 0 ? (max(0, round((($totalPending - $breachedSla) / $totalPending) * 100, 1))) : 100.0);

        $approvedThisWeek = $approvals->filter(function ($p) use ($now) {
            return $p->status === 'approved' &&
                $p->decided_at &&
                Carbon::parse($p->decided_at)->greaterThanOrEqualTo($now->copy()->subDays(7));
        })->count();

        return [
            'total_pending' => $totalPending,
            'approaching_sla' => $approachingSla,
            'breached_sla' => $breachedSla,
            'compliance_percentage' => $complianceRate,
            'approved_this_week' => $approvedThisWeek,
        ];
    }
}
