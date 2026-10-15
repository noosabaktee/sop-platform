<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\BusinessRecord;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ApprovalController extends Controller
{
    /**
     * List all record approval requests for the user's company.
     */
    public function index(Request $request): JsonResponse
    {
        $approvals = Approval::where('company_id', $request->user()->company_id)
            ->latest()
            ->paginate(50);

        return response()->json([
            'data' => $approvals,
        ]);
    }

    /**
     * Approve or reject a business record approval request.
     */
    public function decide(Request $request, Approval $approval): JsonResponse
    {
        abort_unless(
            $approval->company_id === $request->user()->company_id && $request->user()->canManageRecords(),
            403
        );

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'comment' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($approval, $request, $validated) {
            $lockedApproval = Approval::whereKey($approval->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedApproval->status === 'pending', 409);

            $lockedApproval->update([
                'status' => $validated['decision'],
                'comment' => $validated['comment'] ?? null,
                'approver_id' => $request->user()->id,
                'decided_at' => now(),
            ]);

            $record = BusinessRecord::findOrFail($lockedApproval->business_record_id);
            $record->status = $lockedApproval->status;
            $record->version++;
            $record->save();

            AuditService::record(
                $request->user(),
                'approval:'.$lockedApproval->status,
                'approval',
                $lockedApproval->id
            );

            return response()->json([
                'data' => $lockedApproval,
            ]);
        });
    }
}
