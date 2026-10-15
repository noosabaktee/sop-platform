<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Fetch report dataset based on validated request criteria.
     */
    private function data(Request $request): array
    {
        $validated = $request->validate([
            'type' => [
                'required',
                Rule::in(['sales', 'projects', 'inventory', 'purchase', 'finance', 'tax', 'management', 'bd']),
            ],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $allowedRoles = ['super_admin', 'admin', 'manager'];
        $domainRole = match ($validated['type']) {
            'finance', 'tax', 'management' => 'finance',
            'sales', 'bd' => 'sales',
            'projects' => 'project_manager',
            'inventory' => 'warehouse',
            'purchase' => 'procurement',
        };

        abort_unless(in_array($request->user()->role, [...$allowedRoles, $domainRole], true), 403);

        $companyId = $request->user()->company_id;
        $fromDate = $validated['from'] ?? null;
        $toDate = $validated['to'] ?? null;

        $baseQuery = match ($validated['type']) {
            'sales' => DB::table('invoices as i')
                ->join('customers as c', 'c.id', '=', 'i.customer_id')
                ->where('i.company_id', $companyId)
                ->when($fromDate, fn ($q) => $q->whereDate('i.created_at', '>=', $fromDate))
                ->when($toDate, fn ($q) => $q->whereDate('i.created_at', '<=', $toDate))
                ->select('i.number', 'c.name as customer', 'i.amount', 'i.paid_amount', 'i.status', 'i.due_date'),

            'projects' => DB::table('projects as p')
                ->join('customers as c', 'c.id', '=', 'p.customer_id')
                ->where('p.company_id', $companyId)
                ->select('p.code', 'p.name', 'c.name as customer', 'p.contract_value', 'p.budget', 'p.status'),

            'inventory' => DB::table('inventory_movements as m')
                ->join('products as p', 'p.id', '=', 'm.product_id')
                ->where('m.company_id', $companyId)
                ->when($fromDate, fn ($q) => $q->whereDate('m.posted_at', '>=', $fromDate))
                ->when($toDate, fn ($q) => $q->whereDate('m.posted_at', '<=', $toDate))
                ->select('m.reference', 'p.sku', 'p.name as product', 'm.quantity', 'm.unit_cost', 'm.movement_type', 'm.posted_at'),

            'purchase' => DB::table('purchase_orders as p')
                ->join('vendors as v', 'v.id', '=', 'p.vendor_id')
                ->where('p.company_id', $companyId)
                ->select('p.number', 'v.name as vendor', 'p.total', 'p.status', 'p.created_at'),

            'finance' => DB::table('journal_entries as j')
                ->where('j.company_id', $companyId)
                ->when($fromDate, fn ($q) => $q->whereDate('j.posting_date', '>=', $fromDate))
                ->when($toDate, fn ($q) => $q->whereDate('j.posting_date', '<=', $toDate))
                ->select('j.number', 'j.posting_date', 'j.description', 'j.status'),

            'tax' => DB::table('invoices as i')
                ->join('customers as c', 'c.id', '=', 'i.customer_id')
                ->where('i.company_id', $companyId)
                ->when($fromDate, fn ($q) => $q->whereDate('i.created_at', '>=', $fromDate))
                ->when($toDate, fn ($q) => $q->whereDate('i.created_at', '<=', $toDate))
                ->select(
                    'i.number as nomor_faktur',
                    'c.name as pihak_terkait',
                    DB::raw("'PPN Keluaran' as tipe_pajak"),
                    DB::raw('ROUND(i.amount / 1.11, 2) as dpp'),
                    DB::raw('ROUND(i.amount - (i.amount / 1.11), 2) as ppn_11_persen'),
                    'i.status',
                    'i.created_at as tanggal'
                ),

            'management' => DB::table('projects as p')
                ->join('customers as c', 'c.id', '=', 'p.customer_id')
                ->where('p.company_id', $companyId)
                ->select(
                    'p.code as kode_proyek',
                    'p.name as nama_inisiatif',
                    'c.name as klien',
                    'p.contract_value as nilai_kontrak',
                    'p.budget as plafon_anggaran',
                    'p.status as status_eksekusi'
                ),

            'bd' => DB::table('crm_tenders as t')
                ->where('t.company_id', $companyId)
                ->select(
                    't.code as kode_tender',
                    't.name as nama_tender',
                    't.client as instansi',
                    't.value as nilai_tender',
                    't.bid as status_bid',
                    't.status as hasil_tender',
                    't.deadline as batas_waktu'
                ),
        };

        return [
            'type' => $validated['type'],
            'rows' => $baseQuery->limit(2000)->get()->map(fn ($row) => (array) $row)->all(),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Display the operational report as JSON data.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->data($request),
        ]);
    }

    /**
     * Download the report as a CSV file.
     */
    public function csv(Request $request): StreamedResponse
    {
        $report = $this->data($request);
        $headers = array_keys($report['rows'][0] ?? ['message' => 'no rows']);

        return response()->streamDownload(
            function () use ($report, $headers) {
                $output = fopen('php://output', 'w');
                // UTF-8 BOM for Microsoft Excel compatibility
                fwrite($output, "\xEF\xBB\xBF");
                fputcsv($output, $headers);

                foreach ($report['rows'] as $row) {
                    fputcsv(
                        $output,
                        array_map(static function ($value) {
                            $str = (string) ($value ?? '');

                            // Prevent CSV formula injection when opened in spreadsheet software
                            return preg_match('/^\s*[=+@\-\t\r]/u', $str) ? "'".$str : $str;
                        }, array_values($row))
                    );
                }

                fclose($output);
            },
            'sop-'.$report['type'].'-'.date('Ymd').'.csv',
            ['Content-Type' => 'text/csv; charset=UTF-8']
        );
    }
}
