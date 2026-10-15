<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as Dec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InventoryOperationsController extends Controller
{
    /**
     * Get inventory dashboard summary: balances, active batches, and recent movements.
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $balances = DB::table('inventory_movements as m')
            ->join('products as p', 'p.id', '=', 'm.product_id')
            ->join('warehouses as w', 'w.id', '=', 'm.warehouse_id')
            ->where('m.company_id', $companyId)
            ->groupBy('m.product_id', 'm.warehouse_id', 'p.sku', 'p.name', 'p.unit', 'w.code', 'w.name')
            ->select('m.product_id', 'm.warehouse_id', 'p.sku', 'p.name as product', 'p.unit', 'w.code as warehouse_code', 'w.name as warehouse')
            ->selectRaw('SUM(m.quantity) as quantity')
            ->selectRaw('SUM(m.quantity * m.unit_cost) as movement_cost')
            ->orderBy('p.sku')
            ->get();

        $batches = DB::table('inventory_movements as m')
            ->join('products as p', 'p.id', '=', 'm.product_id')
            ->join('warehouses as w', 'w.id', '=', 'm.warehouse_id')
            ->where('m.company_id', $companyId)
            ->whereNotNull('m.batch_number')
            ->groupBy('m.product_id', 'm.warehouse_id', 'm.batch_number', 'p.sku', 'p.name', 'p.unit', 'w.code', 'w.name')
            ->select('m.product_id', 'm.warehouse_id', 'm.batch_number', 'p.sku', 'p.name as product', 'p.unit', 'w.code as warehouse_code', 'w.name as warehouse')
            ->selectRaw('MAX(m.expiry_date) as expiry_date')
            ->selectRaw('SUM(m.quantity) as quantity')
            ->havingRaw('SUM(m.quantity) > 0')
            ->orderByRaw('MAX(m.expiry_date) ASC NULLS LAST')
            ->orderBy('m.batch_number')
            ->get();

        $movements = DB::table('inventory_movements as m')
            ->join('products as p', 'p.id', '=', 'm.product_id')
            ->join('warehouses as w', 'w.id', '=', 'm.warehouse_id')
            ->where('m.company_id', $companyId)
            ->orderByDesc('m.posted_at')
            ->limit(200)
            ->get([
                'm.id',
                'p.sku',
                'p.name as product',
                'w.name as warehouse',
                'm.quantity',
                'm.unit_cost',
                'm.movement_type',
                'm.reference',
                'm.batch_number',
                'm.serial_number',
                'm.expiry_date',
                'm.posted_at',
            ]);

        return response()->json([
            'data' => [
                'balances' => $balances,
                'batches' => $batches,
                'movements' => $movements,
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get active batch inventory filtered optionally by product and warehouse.
     */
    public function batches(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $query = DB::table('inventory_movements as m')
            ->join('products as p', 'p.id', '=', 'm.product_id')
            ->join('warehouses as w', 'w.id', '=', 'm.warehouse_id')
            ->where('m.company_id', $companyId)
            ->whereNotNull('m.batch_number');

        if ($request->filled('product_id')) {
            $query->where('m.product_id', $request->query('product_id'));
        }

        if ($request->filled('warehouse_id')) {
            $query->where('m.warehouse_id', $request->query('warehouse_id'));
        }

        $batches = $query->groupBy('m.product_id', 'm.warehouse_id', 'm.batch_number', 'p.sku', 'p.name', 'p.unit', 'w.code', 'w.name')
            ->select('m.product_id', 'm.warehouse_id', 'm.batch_number', 'p.sku', 'p.name as product', 'p.unit', 'w.code as warehouse_code', 'w.name as warehouse')
            ->selectRaw('MAX(m.expiry_date) as expiry_date')
            ->selectRaw('SUM(m.quantity) as quantity')
            ->havingRaw('SUM(m.quantity) > 0')
            ->orderByRaw('MAX(m.expiry_date) ASC NULLS LAST')
            ->orderBy('m.batch_number')
            ->get();

        return response()->json([
            'data' => $batches,
        ]);
    }

    /**
     * Record a manual inventory adjustment with idempotency and balance safeguards.
     */
    public function adjust(Request $request): JsonResponse
    {
        abort_unless(
            in_array($request->user()->role, ['super_admin', 'admin', 'manager', 'warehouse'], true),
            403
        );

        $companyId = $request->user()->company_id;

        $data = $request->validate([
            'product_id' => ['required', 'ulid', Rule::exists('products', 'id')->where('company_id', $companyId)],
            'warehouse_id' => ['required', 'ulid', Rule::exists('warehouses', 'id')->where('company_id', $companyId)],
            'quantity' => ['required', 'regex:/^-?\d{1,12}(?:\.\d{1,4})?$/'],
            'reason' => ['required', 'string', 'min:6', 'max:500'],
            'batch_number' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'expiry_date' => ['nullable', 'date'],
            'idempotency_key' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        return DB::transaction(function () use ($request, $companyId, $data) {
            $existing = DB::table('inventory_movements')
                ->where('company_id', $companyId)
                ->where('idempotency_key', $data['idempotency_key'])
                ->first();

            if ($existing) {
                return response()->json([
                    'data' => $existing,
                    'already_exists' => true,
                ]);
            }

            $product = DB::table('products')
                ->where('company_id', $companyId)
                ->where('id', $data['product_id'])
                ->lockForUpdate()
                ->first();

            abort_unless($product, 404);

            $quantity = Dec::parse(ltrim($data['quantity'], '-'), 4) * ($data['quantity'][0] === '-' ? -1 : 1);
            abort_unless($quantity !== 0, 422, 'Quantity tidak boleh nol.');

            $balanceQuery = DB::table('inventory_movements')
                ->where('company_id', $companyId)
                ->where('product_id', $data['product_id'])
                ->where('warehouse_id', $data['warehouse_id']);

            if (! empty($data['batch_number'])) {
                $balanceQuery->where('batch_number', $data['batch_number']);
            }

            $currentBalance = $balanceQuery->sum('quantity');
            abort_unless(Dec::parse((string) $currentBalance, 4) + $quantity >= 0, 422, 'Stok tidak cukup.');

            $id = (string) Str::ulid();
            $now = now();

            DB::table('inventory_movements')->insert([
                'id' => $id,
                'company_id' => $companyId,
                'product_id' => $data['product_id'],
                'warehouse_id' => $data['warehouse_id'],
                'actor_id' => $request->user()->id,
                'quantity' => Dec::format($quantity, 4),
                'unit_cost' => $product->standard_cost,
                'movement_type' => 'manual_adjustment',
                'reference' => $data['reason'],
                'batch_number' => $data['batch_number'] ?? null,
                'serial_number' => $data['serial_number'] ?? null,
                'expiry_date' => $data['expiry_date'] ?? null,
                'idempotency_key' => $data['idempotency_key'],
                'posted_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record(
                $request->user(),
                'inventory.adjusted',
                'inventory_movement',
                $id,
                null,
                [
                    'quantity' => Dec::format($quantity, 4),
                    'reason' => $data['reason'],
                    'batch_number' => $data['batch_number'] ?? null,
                ]
            );

            return response()->json([
                'data' => DB::table('inventory_movements')->find($id),
            ], 201);
        });
    }
}
