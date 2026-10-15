<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AccountingPeriodController extends Controller
{
    /**
     * Authorize finance and administrative roles.
     */
    private function authorizeFinance(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['super_admin', 'admin', 'manager', 'finance'], true),
            403
        );
    }

    /**
     * List accounting periods for the current company.
     */
    public function index(Request $request): JsonResponse
    {
        $periods = DB::table('accounting_periods')
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('ends_on')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $periods,
        ]);
    }

    /**
     * Close an accounting period, locking transactions within its date range.
     */
    public function close(Request $request): JsonResponse
    {
        $this->authorizeFinance($request);
        $companyId = (string) $request->user()->company_id;

        $data = $request->validate([
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        return DB::transaction(function () use ($request, $companyId, $data) {
            // Lock the tenant row so concurrent close requests cannot create overlapping periods.
            DB::table('companies')->where('id', $companyId)->lockForUpdate()->firstOrFail();

            $overlap = DB::table('accounting_periods')
                ->where('company_id', $companyId)
                ->where('status', 'closed')
                ->whereDate('starts_on', '<=', $data['ends_on'])
                ->whereDate('ends_on', '>=', $data['starts_on'])
                ->first();

            abort_if($overlap, 409, 'Rentang periode bertumpang tindih dengan periode yang sudah ditutup.');

            $id = (string) Str::ulid();
            $now = now();

            DB::table('accounting_periods')->insert([
                'id' => $id,
                'company_id' => $companyId,
                'starts_on' => $data['starts_on'],
                'ends_on' => $data['ends_on'],
                'status' => 'closed',
                'closed_by' => $request->user()->id,
                'closed_at' => $now,
                'note' => $data['note'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record(
                $request->user(),
                'accounting_period.closed',
                'accounting_period',
                $id,
                null,
                [
                    'starts_on' => $data['starts_on'],
                    'ends_on' => $data['ends_on'],
                ]
            );

            return response()->json([
                'data' => DB::table('accounting_periods')->find($id),
            ], 201);
        });
    }

    /**
     * Reopen a closed accounting period (Super Admin only).
     */
    public function reopen(Request $request, string $id): JsonResponse
    {
        abort_unless($request->user()->role === 'super_admin', 403);
        $companyId = (string) $request->user()->company_id;

        return DB::transaction(function () use ($request, $companyId, $id) {
            $period = DB::table('accounting_periods')
                ->where('company_id', $companyId)
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            abort_unless($period, 404);
            abort_unless($period->status === 'closed', 409, 'Periode sudah dibuka kembali.');

            DB::table('accounting_periods')
                ->where('id', $id)
                ->update([
                    'status' => 'reopened',
                    'reopened_by' => $request->user()->id,
                    'reopened_at' => now(),
                    'updated_at' => now(),
                ]);

            AuditService::record(
                $request->user(),
                'accounting_period.reopened',
                'accounting_period',
                $id,
                ['status' => 'closed'],
                ['status' => 'reopened']
            );

            return response()->json([
                'data' => DB::table('accounting_periods')->find($id),
            ]);
        });
    }
}
