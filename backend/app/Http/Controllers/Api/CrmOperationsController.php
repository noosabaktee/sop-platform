<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Authoritative opportunities for the existing Business Development grid. */
class CrmOperationsController extends Controller
{
    private function company(Request $r): string
    {
        return (string) $r->user()->company_id;
    }

    public function options(Request $r)
    {
        $co = $this->company($r);

        return response()->json(['data' => [
            'customers' => DB::table('customers')->where('company_id', $co)->where('status', 'active')->orderBy('name')->get(['id', 'code', 'name']),
            'owners' => DB::table('users')->where('company_id', $co)->where('is_active', true)->orderBy('name')->get(['id', 'name', 'role']),
        ]]);
    }

    public function customers(Request $r)
    {
        $co = $this->company($r);
        $invoices = DB::table('invoices')->where('company_id', $co)->groupBy('customer_id')->select('customer_id', DB::raw('COALESCE(SUM(amount),0) as revenue'), DB::raw("COALESCE(SUM(CASE WHEN status IN ('posted','partial') THEN amount-paid_amount ELSE 0 END),0) as outstanding_ar"));

        return response()->json(['data' => DB::table('customers as c')->leftJoinSub($invoices, 'i', 'i.customer_id', '=', 'c.id')->where('c.company_id', $co)->orderBy('c.name')
            ->get(['c.id', 'c.code', 'c.name', 'c.status', DB::raw('COALESCE(i.revenue,0) as revenue'), DB::raw('COALESCE(i.outstanding_ar,0) as outstanding_ar')])]);
    }

    public function opportunities(Request $r)
    {
        $co = $this->company($r);

        return response()->json(['data' => DB::table('opportunities as o')->join('customers as c', 'c.id', '=', 'o.customer_id')
            ->leftJoin('users as u', 'u.id', '=', 'o.owner_id')->where('o.company_id', $co)->orderByDesc('o.created_at')->limit(500)
            ->get(['o.*', 'c.name as customer', 'u.name as owner'])]);
    }

    public function createOpportunity(Request $r)
    {
        abort_unless(in_array($r->user()->role, ['super_admin', 'admin', 'manager', 'sales'], true), 403);
        $co = $this->company($r);
        $d = $r->validate(['customer_id' => ['required', 'ulid', Rule::exists('customers', 'id')->where('company_id', $co)],
            'name' => ['required', 'string', 'min:2', 'max:255'], 'owner_id' => ['nullable', 'ulid', Rule::exists('users', 'id')->where('company_id', $co)],
            'stage' => ['required', Rule::in(['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])],
            'amount' => ['required', 'numeric', 'min:0', 'decimal:0,2'], 'probability' => ['required', 'integer', 'between:0,100'], 'expected_close' => ['nullable', 'date']]);

        return DB::transaction(function () use ($r, $co, $d) {
            $id = (string) Str::ulid();
            $now = now();
            DB::table('opportunities')->insert($d + ['id' => $id, 'company_id' => $co, 'owner_id' => $d['owner_id'] ?? $r->user()->id, 'created_at' => $now, 'updated_at' => $now]);
            AuditService::record($r->user(), 'opportunity.created', 'opportunity', $id, null, ['customer_id' => $d['customer_id'], 'amount' => $d['amount']]);

            return response()->json(['data' => DB::table('opportunities')->find($id)], 201);
        });
    }

    public function updateOpportunity(Request $r, string $id)
    {
        $co = $this->company($r);
        $d = $r->validate(['stage' => ['sometimes', Rule::in(['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])],
            'probability' => ['sometimes', 'integer', 'between:0,100'], 'expected_close' => ['sometimes', 'nullable', 'date']]);

        return DB::transaction(function () use ($r, $co, $id, $d) {
            $op = DB::table('opportunities')->where('company_id', $co)->where('id', $id)->lockForUpdate()->first();
            abort_unless($op, 404);
            abort_unless($r->user()->canManageRecords() || $op->owner_id === $r->user()->id, 403);
            DB::table('opportunities')->where('id', $id)->update($d + ['updated_at' => now()]);
            AuditService::record($r->user(), 'opportunity.updated', 'opportunity', $id, ['stage' => $op->stage, 'probability' => $op->probability], $d);

            return response()->json(['data' => DB::table('opportunities')->find($id)]);
        });
    }

    public function convertToProject(Request $r, string $id)
    {
        $co = $this->company($r);

        return DB::transaction(function () use ($r, $co, $id) {
            $op = DB::table('opportunities')->where('company_id', $co)->where('id', $id)->lockForUpdate()->first();
            abort_unless($op, 404);
            abort_unless($r->user()->canManageRecords() || $op->owner_id === $r->user()->id, 403);
            abort_unless($op->stage === 'won', 409, 'Hanya opportunity Won yang dapat menjadi project.');
            $existing = DB::table('projects')->where('opportunity_id', $id)->first();
            if ($existing) {
                return response()->json(['data' => $existing, 'already_exists' => true]);
            }
            $manager = $op->owner_id ?: $r->user()->id;
            $active = DB::table('users')->where('company_id', $co)->where('id', $manager)->where('is_active', true)->exists();
            if (! $active) {
                $manager = $r->user()->id;
            }
            $project = (string) Str::ulid();
            $now = now();
            $code = 'PRJ-OPP-'.strtoupper(substr(str_replace('-', '', $id), -10));
            DB::table('projects')->insert(['id' => $project, 'company_id' => $co, 'opportunity_id' => $id, 'customer_id' => $op->customer_id, 'manager_id' => $manager,
                'code' => $code, 'name' => $op->name, 'status' => 'planning', 'started_at' => $now->toDateString(), 'due_at' => $op->expected_close,
                'contract_value' => $op->amount, 'budget' => '0.00', 'created_at' => $now, 'updated_at' => $now]);
            AuditService::record($r->user(), 'opportunity.converted_to_project', 'project', $project, null, ['opportunity_id' => $id, 'code' => $code]);

            return response()->json(['data' => DB::table('projects')->find($project)], 201);
        });
    }

    public function history(Request $r)
    {
        $co = $this->company($r);
        $quotes = DB::table('quotations')->where('company_id', $co)->groupBy('customer_id')
            ->select('customer_id', DB::raw('COUNT(*) as quote_count'), DB::raw('MAX(created_at) as last_quote'));
        $orders = DB::table('sales_orders')->where('company_id', $co)->groupBy('customer_id')
            ->select('customer_id', DB::raw('COUNT(*) as order_count'), DB::raw('MAX(created_at) as last_order'));
        $invoices = DB::table('invoices')->where('company_id', $co)->groupBy('customer_id')
            ->select('customer_id', DB::raw('COUNT(*) as invoice_count'), DB::raw('MAX(created_at) as last_invoice'));

        $rows = DB::table('customers as c')
            ->leftJoinSub($quotes, 'q', 'q.customer_id', '=', 'c.id')
            ->leftJoinSub($orders, 'o', 'o.customer_id', '=', 'c.id')
            ->leftJoinSub($invoices, 'i', 'i.customer_id', '=', 'c.id')
            ->where('c.company_id', $co)
            ->orderBy('c.name')
            ->get([
                'c.id as customer_id', 'c.name as customer',
                DB::raw('COALESCE(q.quote_count,0) as quotations'),
                DB::raw('COALESCE(o.order_count,0) as orders'),
                DB::raw('COALESCE(i.invoice_count,0) as invoices'),
                DB::raw('GREATEST(q.last_quote, o.last_order, i.last_invoice) as last_activity'),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function forecast(Request $r)
    {
        $co = $this->company($r);
        $owners = DB::table('users')->where('company_id', $co)->where('is_active', true)->get(['id', 'name']);
        $opps = DB::table('opportunities')->where('company_id', $co)->get();

        $result = $owners->map(function ($user) use ($opps) {
            $userOpps = $opps->where('owner_id', $user->id);
            $pipeline = $userOpps->sum(fn ($o) => (float) $o->amount);
            $commit = $userOpps->whereIn('stage', ['won', 'negotiation'])->sum(fn ($o) => (float) $o->amount);
            $best = $userOpps->where('probability', '>=', 50)->sum(fn ($o) => (float) $o->amount);

            return [
                'owner_id' => $user->id,
                'owner' => $user->name,
                'pipeline' => number_format($pipeline / 1000000,2,'.',''),
                'commit' => number_format($commit / 1000000,2,'.',''),
                'best' => number_format($best / 1000000,2,'.',''),
                'target' => '2000.00',
            ];
        });

        return response()->json(['data' => $result]);
    }
}
