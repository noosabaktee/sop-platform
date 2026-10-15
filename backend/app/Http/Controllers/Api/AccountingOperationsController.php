<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccountingPeriodService;
use App\Services\AuditService;
use App\Services\ExactDecimal as Dec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccountingOperationsController extends Controller
{
    /**
     * Provide list of available chart of accounts for the tenant.
     */
    public function options(Request $request): JsonResponse
    {
        $accounts = DB::table('chart_of_accounts')
            ->where('company_id', $request->user()->company_id)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'type']);

        return response()->json([
            'data' => [
                'accounts' => $accounts,
            ],
        ]);
    }

    /**
     * Calculate and display trial balance and recent posted journals.
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $fromDate = $request->input('from');
        $toDate = $request->input('to');

        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $lines = DB::table('journal_lines as l')
            ->join('journal_entries as e', 'e.id', '=', 'l.journal_entry_id')
            ->join('chart_of_accounts as a', 'a.id', '=', 'l.account_id')
            ->where('e.company_id', $companyId)
            ->where('e.status', 'posted')
            ->when($fromDate, fn ($q) => $q->whereDate('e.posting_date', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('e.posting_date', '<=', $toDate))
            ->groupBy('a.id', 'a.code', 'a.name', 'a.type')
            ->select('a.id', 'a.code', 'a.name', 'a.type')
            ->selectRaw('SUM(l.debit) as debit, SUM(l.credit) as credit')
            ->orderBy('a.code')
            ->get();

        $totalDebits = 0;
        $totalCredits = 0;
        $totalIncome = 0;
        $totalExpense = 0;

        foreach ($lines as $line) {
            $debit = Dec::parse((string) $line->debit);
            $credit = Dec::parse((string) $line->credit);
            $totalDebits += $debit;
            $totalCredits += $credit;

            if ($line->type === 'income') {
                $totalIncome += $credit - $debit;
            }
            if ($line->type === 'expense') {
                $totalExpense += $debit - $credit;
            }
        }

        $lineTotals = DB::table('journal_lines')
            ->select('journal_entry_id')
            ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->groupBy('journal_entry_id');

        $entries = DB::table('journal_entries as e')
            ->leftJoinSub($lineTotals, 's', 's.journal_entry_id', '=', 'e.id')
            ->where('e.company_id', $companyId)
            ->when($fromDate, fn ($q) => $q->whereDate('e.posting_date', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('e.posting_date', '<=', $toDate))
            ->select('e.*', 's.total_debit', 's.total_credit')
            ->orderByDesc('e.posting_date')
            ->limit(150)
            ->get();

        return response()->json([
            'data' => [
                'trial_balance' => $lines,
                'total_debit' => Dec::format($totalDebits),
                'total_credit' => Dec::format($totalCredits),
                'balanced' => $totalDebits === $totalCredits,
                'revenue' => Dec::format($totalIncome),
                'expenses' => Dec::format($totalExpense),
                'profit' => Dec::format($totalIncome - $totalExpense),
                'entries' => $entries,
            ],
        ]);
    }

    /**
     * Post a manual double-entry journal with balance verification.
     */
    public function postManual(Request $request): JsonResponse
    {
        abort_unless(
            in_array($request->user()->role, ['super_admin', 'admin', 'manager', 'finance'], true),
            403
        );

        $companyId = $request->user()->company_id;

        $data = $request->validate([
            'date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:500'],
            'source_id' => ['required', 'ulid'],
            'lines' => ['required', 'array', 'min:2', 'max:50'],
            'lines.*.account_id' => ['required', 'ulid', Rule::exists('chart_of_accounts', 'id')->where('company_id', $companyId)],
            'lines.*.debit' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'lines.*.credit' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
        ]);

        return DB::transaction(function () use ($request, $companyId, $data) {
            $existing = DB::table('journal_entries')
                ->where('company_id', $companyId)
                ->where('source_type', 'manual')
                ->where('source_id', $data['source_id'])
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return response()->json([
                    'data' => $existing,
                    'already_exists' => true,
                ]);
            }

            app(AccountingPeriodService::class)->assertOpen($companyId, $data['date']);

            $sumDebit = 0;
            $sumCredit = 0;

            foreach ($data['lines'] as $line) {
                $debit = Dec::parse((string) $line['debit']);
                $credit = Dec::parse((string) $line['credit']);

                if (($debit > 0 && $credit > 0) || ($debit === 0 && $credit === 0)) {
                    throw ValidationException::withMessages(['lines' => 'Setiap baris harus hanya debit atau kredit.']);
                }

                $sumDebit += $debit;
                $sumCredit += $credit;
            }

            if ($sumDebit !== $sumCredit || $sumDebit <= 0) {
                throw ValidationException::withMessages(['lines' => 'Total debit dan kredit harus sama dan lebih dari nol.']);
            }

            $id = (string) Str::ulid();
            $now = now();

            DB::table('journal_entries')->insert([
                'id' => $id,
                'company_id' => $companyId,
                'number' => 'JRN-'.strtoupper((string) Str::ulid()),
                'posting_date' => $data['date'],
                'description' => $data['description'],
                'status' => 'posted',
                'source_type' => 'manual',
                'source_id' => $data['source_id'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($data['lines'] as $line) {
                DB::table('journal_lines')->insert([
                    'id' => (string) Str::ulid(),
                    'journal_entry_id' => $id,
                    'account_id' => $line['account_id'],
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            AuditService::record(
                $request->user(),
                'journal.posted',
                'journal_entry',
                $id,
                null,
                [
                    'debit' => Dec::format($sumDebit),
                    'lines' => count($data['lines']),
                ]
            );

            return response()->json([
                'data' => DB::table('journal_entries')->find($id),
            ], 201);
        });
    }
}
