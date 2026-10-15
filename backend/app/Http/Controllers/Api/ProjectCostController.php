<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccountingPeriodService;
use App\Services\AuditService;
use App\Services\ExactDecimal as D;
use App\Services\JournalPostingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProjectCostController extends Controller
{
    private function company(Request $r): string
    {
        return (string) $r->user()->company_id;
    }

    public function index(Request $r)
    {
        $co = $this->company($r);

        $projects = DB::table('projects as p')
            ->leftJoin('project_costs as c', 'c.project_id', '=', 'p.id')
            ->where('p.company_id', $co)
            ->groupBy('p.id', 'p.code', 'p.name', 'p.budget', 'p.contract_value', 'p.status')
            ->select([
                'p.id',
                'p.code',
                'p.name',
                'p.status',
                'p.budget',
                'p.contract_value',
                DB::raw('COALESCE(SUM(c.amount), 0) as actual_cost'),
                DB::raw('p.budget - COALESCE(SUM(c.amount), 0) as budget_variance'),
            ])
            ->orderBy('p.code')
            ->get();

        $costs = DB::table('project_costs as c')
            ->join('projects as p', 'p.id', '=', 'c.project_id')
            ->leftJoin('journal_entries as j', 'j.id', '=', 'c.journal_entry_id')
            ->where('c.company_id', $co)
            ->orderByDesc('c.cost_date')
            ->limit(250)
            ->get([
                'c.*',
                'p.code as project_code',
                'p.name as project_name',
                'j.number as journal_number',
                'j.status as journal_status',
            ]);

        $categoryBreakdown = DB::table('project_costs')
            ->where('company_id', $co)
            ->groupBy('category')
            ->select('category', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as count'))
            ->get();

        $totalBudget = (float) $projects->sum('budget');
        $totalActualCost = (float) $projects->sum('actual_cost');
        $totalContract = (float) $projects->sum('contract_value');

        return response()->json([
            'data' => [
                'projects' => $projects,
                'costs' => $costs,
                'summary' => [
                    'total_budget' => $totalBudget,
                    'total_actual_cost' => $totalActualCost,
                    'total_contract_value' => $totalContract,
                    'overall_variance' => $totalBudget - $totalActualCost,
                    'category_breakdown' => $categoryBreakdown,
                ],
                'basis' => 'authoritative_postgresql_with_double_entry_ledger',
            ],
        ]);
    }

    public function store(Request $r)
    {
        abort_unless(in_array($r->user()->role, ['super_admin', 'admin', 'manager', 'finance'], true), 403);
        $co = $this->company($r);

        $d = $r->validate([
            'project_id' => ['required', 'ulid', Rule::exists('projects', 'id')->where('company_id', $co)],
            'reference' => ['required', 'string', 'max:100'],
            'cost_date' => ['required', 'date'],
            'category' => ['required', Rule::in(['material', 'labor', 'expense', 'service', 'other'])],
            'description' => ['required', 'string', 'max:500'],
            'amount' => ['required', 'numeric', 'gt:0', 'decimal:0,2'],
            'payment_method' => ['nullable', Rule::in(['cash', 'payable'])],
            'post_to_ledger' => ['nullable', 'boolean'],
        ]);

        $paymentMethod = $d['payment_method'] ?? 'cash';
        $postToLedger = $d['post_to_ledger'] ?? true;

        if ($postToLedger) {
            app(AccountingPeriodService::class)->assertOpen($co, $d['cost_date']);
        }

        return DB::transaction(function () use ($r, $co, $d, $paymentMethod, $postToLedger) {
            $existing = DB::table('project_costs')
                ->where('company_id', $co)
                ->where('reference', $d['reference'])
                ->first();

            if ($existing) {
                abort_unless(
                    $existing->project_id === $d['project_id'] &&
                    D::parse((string) $existing->amount) === D::parse((string) $d['amount']) &&
                    $existing->category === $d['category'],
                    409,
                    'Reference biaya sudah digunakan untuk transaksi berbeda.'
                );

                return response()->json(['data' => $existing, 'already_exists' => true]);
            }

            $project = DB::table('projects')->where('company_id', $co)->where('id', $d['project_id'])->first();
            abort_unless($project, 404, 'Proyek tidak ditemukan.');

            $id = (string) Str::ulid();
            $now = now();
            $journalId = null;

            if ($postToLedger) {
                $creditAccount = $paymentMethod === 'payable' ? '2100' : '1100';
                $memo = 'Biaya proyek '.$project->code.' ('.$d['category'].'): '.$d['description'];

                $journalId = app(JournalPostingService::class)->post(
                    $co,
                    'project_cost',
                    $id,
                    $memo,
                    '5100',
                    $creditAccount,
                    D::format(D::parse((string) $d['amount'])),
                    $d['cost_date']
                );
            }

            DB::table('project_costs')->insert([
                'id' => $id,
                'company_id' => $co,
                'project_id' => $d['project_id'],
                'created_by' => $r->user()->id,
                'reference' => $d['reference'],
                'cost_date' => $d['cost_date'],
                'category' => $d['category'],
                'description' => $d['description'],
                'amount' => $d['amount'],
                'payment_method' => $paymentMethod,
                'journal_entry_id' => $journalId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record($r->user(), 'project_cost.created', 'project_cost', $id, null, [
                'project_id' => $d['project_id'],
                'amount' => $d['amount'],
                'payment_method' => $paymentMethod,
                'journal_entry_id' => $journalId,
            ]);

            $record = DB::table('project_costs as c')
                ->leftJoin('journal_entries as j', 'j.id', '=', 'c.journal_entry_id')
                ->where('c.id', $id)
                ->select(['c.*', 'j.number as journal_number'])
                ->first();

            return response()->json(['data' => $record], 201);
        });
    }

    public function budgetLedger(Request $r, string $projectId)
    {
        $co = $this->company($r);
        $project = DB::table('projects')
            ->where('company_id', $co)
            ->where('id', $projectId)
            ->first();

        abort_unless($project, 404, 'Proyek tidak ditemukan.');

        $costs = DB::table('project_costs as c')
            ->leftJoin('journal_entries as j', 'j.id', '=', 'c.journal_entry_id')
            ->where('c.company_id', $co)
            ->where('c.project_id', $projectId)
            ->orderBy('c.cost_date')
            ->select(['c.*', 'j.number as journal_number'])
            ->get();

        $categorySummary = $costs->groupBy('category')->map(function ($items, $cat) {
            return [
                'category' => $cat,
                'count' => $items->count(),
                'total' => $items->sum('amount'),
            ];
        })->values();

        $totalActual = (float) $costs->sum('amount');
        $budget = (float) $project->budget;
        $variance = $budget - $totalActual;
        $burnRate = $budget > 0 ? round(($totalActual / $budget) * 100, 1) : 0;

        return response()->json([
            'data' => [
                'project' => $project,
                'budget' => $budget,
                'actual_cost' => $totalActual,
                'variance' => $variance,
                'burn_rate_percent' => $burnRate,
                'by_category' => $categorySummary,
                'costs' => $costs,
            ],
        ]);
    }
}
