<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\BusinessRecord;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RecordController extends Controller
{
    /**
     * Common validation rules for business records.
     */
    private function rules(): array
    {
        return [
            'route' => ['required', 'string', 'max:120', 'regex:/^\/[a-z0-9\/-]+$/'],
            'view_key' => ['required', 'string', 'max:40'],
            'table_index' => ['required', 'integer', 'min:0'],
            'cells' => ['required', 'array', 'max:100'],
            'cells.*' => ['nullable', 'string', 'max:2000'],
            'fields' => ['required', 'array'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'pending', 'approved', 'rejected', 'posted', 'closed'])],
            'version' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * List business records matching route, view_key, and table_index.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'route' => ['required', 'string'],
            'view_key' => ['required', 'string'],
            'table_index' => ['required', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'search' => ['nullable', 'string', 'max:200'],
        ]);

        $query = BusinessRecord::query()
            ->where('company_id', $request->user()->company_id)
            ->where('route', $filters['route'])
            ->where('view_key', $filters['view_key'])
            ->where('table_index', $filters['table_index']);

        if (isset($filters['search'])) {
            $needle = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $filters['search']);
            $query->whereRaw("fields::text ILIKE ? ESCAPE '\\'", ['%'.$needle.'%']);
        }

        $records = $query->orderBy('created_at')->paginate($filters['per_page'] ?? 100);

        return response()->json($records);
    }

    /**
     * Display a specific business record.
     */
    public function show(Request $request, BusinessRecord $businessRecord): JsonResponse
    {
        abort_unless($request->user()->can('view', $businessRecord), 403);

        return response()->json([
            'data' => $businessRecord,
        ]);
    }

    /**
     * Store a new business record.
     */
    public function store(Request $request): JsonResponse
    {
        $request->user()->can('create', BusinessRecord::class) || abort(403);
        $validated = $request->validate($this->rules());

        $model = DB::transaction(function () use ($validated, $request) {
            $model = BusinessRecord::create(array_merge($validated, [
                'company_id' => $request->user()->company_id,
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
                'version' => 1,
                'status' => $validated['status'] ?? 'draft',
            ]));

            AuditService::record($request->user(), 'created', 'business_record', $model->id, null, $model->toArray());

            return $model;
        });

        return response()->json([
            'data' => $model,
        ], 201);
    }

    /**
     * Update an existing business record with optimistic concurrency protection.
     */
    public function update(Request $request, BusinessRecord $businessRecord): JsonResponse
    {
        abort_unless($request->user()->can('update', $businessRecord), 403);
        $validated = $request->validate($this->rules());

        $updated = DB::transaction(function () use ($request, $businessRecord, $validated) {
            $model = BusinessRecord::query()->lockForUpdate()->findOrFail($businessRecord->id);
            abort_unless($model->company_id === $request->user()->company_id, 403);
            abort_if(
                isset($validated['version']) && $validated['version'] !== $model->version,
                409,
                'Record has changed. Refresh before saving.'
            );

            $old = $model->toArray();
            $model->fill($validated);
            $model->version++;
            $model->updated_by = $request->user()->id;
            $model->save();

            AuditService::record($request->user(), 'updated', 'business_record', $model->id, $old, $model->toArray());

            return $model;
        });

        return response()->json([
            'data' => $updated,
        ]);
    }

    /**
     * Soft/hard delete a business record.
     */
    public function destroy(Request $request, BusinessRecord $businessRecord): Response
    {
        abort_unless($request->user()->can('delete', $businessRecord), 403);

        DB::transaction(function () use ($request, $businessRecord) {
            $before = $businessRecord->toArray();
            $businessRecord->delete();
            AuditService::record($request->user(), 'deleted', 'business_record', $businessRecord->id, $before);
        });

        return response()->noContent();
    }

    /**
     * Execute a workflow transition (submit, approve, reject).
     */
    public function transition(Request $request, BusinessRecord $businessRecord): JsonResponse
    {
        abort_unless($request->user()->can('update', $businessRecord), 403);

        $validated = $request->validate([
            'transition' => ['required', Rule::in(['submit', 'approve', 'reject'])],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        return DB::transaction(function () use ($request, $businessRecord, $validated) {
            $record = BusinessRecord::whereKey($businessRecord->id)->lockForUpdate()->firstOrFail();
            $currentStatus = $record->status;
            $transition = $validated['transition'];

            $allowed = match ($transition) {
                'submit' => $currentStatus === 'draft',
                'approve', 'reject' => $currentStatus === 'pending',
            };

            abort_unless($allowed, 422, 'Invalid state transition');

            if (in_array($transition, ['approve', 'reject'], true)) {
                abort_unless($request->user()->canManageRecords(), 403);
            }

            $newStatus = match ($transition) {
                'submit' => 'pending',
                'approve' => 'approved',
                'reject' => 'rejected',
            };

            $record->status = $newStatus;
            $record->version++;
            $record->save();

            Approval::create([
                'company_id' => $record->company_id,
                'business_record_id' => $record->id,
                'requester_id' => $record->created_by,
                'approver_id' => $transition === 'submit' ? null : $request->user()->id,
                'status' => $record->status,
                'comment' => $validated['comment'] ?? null,
                'decided_at' => $transition === 'submit' ? null : now(),
            ]);

            AuditService::record(
                $request->user(),
                'transition:'.$transition,
                'business_record',
                $record->id,
                ['status' => $currentStatus],
                ['status' => $record->status]
            );

            return response()->json([
                'data' => $record,
            ]);
        });
    }
}
