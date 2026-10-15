<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as D;
use App\Services\JournalPostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Stocktake Controller: Count against an immutable inventory snapshot.
 * Ensures no mutation of old ledger rows and synchronizes journal adjustments.
 */
class StocktakeController extends Controller
{
    /**
     * Authorize warehouse and administrative personnel.
     */
    private function guard(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['super_admin', 'admin', 'manager', 'warehouse'], true),
            403
        );
    }

    /**
     * Locate a tenant-scoped stocktake session.
     */
    private function stocktake(Request $request, string $id, bool $lock = false): object
    {
        $query = DB::table('stocktakes')
            ->where('company_id', $request->user()->company_id)
            ->where('id', $id);

        $row = ($lock ? $query->lockForUpdate() : $query)->first();
        abort_unless($row, 404);

        return $row;
    }

    /**
     * Parse decimal strings signed for exact decimal comparison.
     */
    private function signed(string $value): int
    {
        return str_starts_with($value, '-') ? -D::parse(substr($value, 1), 4) : D::parse($value, 4);
    }

    /**
     * List stocktake history for the current company.
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $rows = DB::table('stocktakes as s')
            ->join('warehouses as w', 'w.id', '=', 's.warehouse_id')
            ->where('s.company_id', $companyId)
            ->orderByDesc('s.created_at')
            ->limit(100)
            ->get(['s.*', 'w.name as warehouse']);

        return response()->json([
            'data' => $rows,
        ]);
    }

    /**
     * Show detail of a stocktake session with all its counting lines.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $stocktake = $this->stocktake($request, $id);

        $lines = DB::table('stocktake_lines as l')
            ->join('products as p', 'p.id', '=', 'l.product_id')
            ->where('l.stocktake_id', $stocktake->id)
            ->orderBy('p.sku')
            ->get(['l.*', 'p.name as product', 'p.sku']);

        return response()->json([
            'data' => [
                'stocktake' => $stocktake,
                'lines' => $lines,
            ],
        ]);
    }

    /**
     * Initialize a new stocktake session with immutable expected inventory snapshot.
     */
    public function create(Request $request): JsonResponse
    {
        $this->guard($request);
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'warehouse_id' => ['required', 'ulid', Rule::exists('warehouses', 'id')->where('company_id', $companyId)],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        return DB::transaction(function () use ($request, $companyId, $validated) {
            $hasActiveSession = DB::table('stocktakes')
                ->where('company_id', $companyId)
                ->where('warehouse_id', $validated['warehouse_id'])
                ->where('status', 'counting')
                ->lockForUpdate()
                ->exists();

            abort_if($hasActiveSession, 409, 'Selesaikan stock opname yang masih berjalan.');

            // Lock product master rows in a consistent order with inventory movement writers.
            $products = DB::table('products')
                ->where('company_id', $companyId)
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id']);

            $id = (string) Str::ulid();
            $now = now();

            DB::table('stocktakes')->insert([
                'id' => $id,
                'company_id' => $companyId,
                'warehouse_id' => $validated['warehouse_id'],
                'created_by' => $request->user()->id,
                'number' => 'SO-'.strtoupper((string) Str::ulid()),
                'status' => 'counting',
                'snapshot_at' => $now,
                'note' => $validated['note'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($products as $product) {
                $sum = DB::table('inventory_movements')
                    ->where('company_id', $companyId)
                    ->where('warehouse_id', $validated['warehouse_id'])
                    ->where('product_id', $product->id)
                    ->sum('quantity');

                DB::table('stocktake_lines')->insert([
                    'id' => (string) Str::ulid(),
                    'stocktake_id' => $id,
                    'product_id' => $product->id,
                    'expected_qty' => D::format($this->signed((string) $sum), 4),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            AuditService::record($request->user(), 'stocktake.created', 'stocktake', $id);

            return response()->json([
                'data' => [
                    'id' => $id,
                    'lines' => count($products),
                ],
            ], 201);
        });
    }

    /**
     * Input physical counted quantity for a specific stocktake line.
     */
    public function count(Request $request, string $id, string $line): JsonResponse
    {
        $this->guard($request);

        $data = $request->validate([
            'counted_qty' => ['required', 'regex:/^\d{1,12}(?:\.\d{1,4})?$/'],
        ]);

        return DB::transaction(function () use ($request, $id, $line, $data) {
            $stocktake = $this->stocktake($request, $id, true);
            abort_unless($stocktake->status === 'counting', 409, 'Stock opname sudah diposting.');

            $affected = DB::table('stocktake_lines')
                ->where('stocktake_id', $stocktake->id)
                ->where('id', $line)
                ->update([
                    'counted_qty' => $data['counted_qty'],
                    'counted_by' => $request->user()->id,
                    'counted_at' => now(),
                    'updated_at' => now(),
                ]);

            abort_unless($affected, 404);

            AuditService::record($request->user(), 'stocktake.counted', 'stocktake_line', $line, null, $data);

            return response()->json([
                'data' => DB::table('stocktake_lines')->find($line),
            ]);
        });
    }

    /**
     * Post stock opname results, adjust inventory and write double-entry journal entries.
     */
    public function post(Request $request, string $id): JsonResponse
    {
        $this->guard($request);

        return DB::transaction(function () use ($request, $id) {
            $stocktake = $this->stocktake($request, $id, true);

            if ($stocktake->status === 'posted') {
                return response()->json([
                    'data' => $stocktake,
                    'already_processed' => true,
                ]);
            }

            abort_unless($stocktake->status === 'counting', 409);

            $lines = DB::table('stocktake_lines')->where('stocktake_id', $id)->get();
            abort_if($lines->isEmpty(), 422, 'Tidak ada produk untuk dihitung.');
            abort_if($lines->contains(fn ($line) => $line->counted_qty === null), 422, 'Semua baris wajib dihitung sebelum posting.');

            $companyId = $request->user()->company_id;
            $now = now();
            $adjustments = 0;

            foreach ($lines->sortBy('product_id') as $line) {
                $product = DB::table('products')
                    ->where('company_id', $companyId)
                    ->where('id', $line->product_id)
                    ->lockForUpdate()
                    ->first();

                abort_unless($product, 404);

                $current = $this->signed((string) DB::table('inventory_movements')
                    ->where('company_id', $companyId)
                    ->where('warehouse_id', $stocktake->warehouse_id)
                    ->where('product_id', $line->product_id)
                    ->sum('quantity'));

                abort_unless(
                    $current === $this->signed((string) $line->expected_qty),
                    409,
                    'Stok berubah sejak snapshot. Buat stock opname baru.'
                );

                $delta = D::parse((string) $line->counted_qty, 4) - $current;
                if ($delta !== 0) {
                    $adjustments++;

                    DB::table('inventory_movements')->insert([
                        'id' => (string) Str::ulid(),
                        'company_id' => $companyId,
                        'product_id' => $line->product_id,
                        'warehouse_id' => $stocktake->warehouse_id,
                        'actor_id' => $request->user()->id,
                        'quantity' => D::format($delta, 4),
                        'unit_cost' => $product->standard_cost,
                        'movement_type' => 'stocktake_adjustment',
                        'reference' => $stocktake->number,
                        'source_type' => 'stocktake',
                        'source_id' => $id,
                        'idempotency_key' => 'stocktake-'.$line->id,
                        'posted_at' => $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);

                    // Financial counterpart of the approved stock correction: no orphan stock changes.
                    $amount = D::line(D::format(abs($delta), 4), (string) $product->standard_cost);
                    if ($amount > 0) {
                        (new JournalPostingService)->post(
                            $companyId,
                            'stocktake_adjustment',
                            $line->id,
                            'Koreksi opname '.$stocktake->number,
                            $delta > 0 ? '1300' : '5100',
                            $delta > 0 ? '5100' : '1300',
                            D::format($amount),
                            now()->toDateString()
                        );
                    }
                }
            }

            DB::table('stocktakes')->where('id', $id)->update([
                'status' => 'posted',
                'posted_by' => $request->user()->id,
                'posted_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record(
                $request->user(),
                'stocktake.posted',
                'stocktake',
                $id,
                null,
                ['adjustments' => $adjustments]
            );

            return response()->json([
                'data' => DB::table('stocktakes')->find($id),
                'adjustments' => $adjustments,
            ]);
        });
    }
}
