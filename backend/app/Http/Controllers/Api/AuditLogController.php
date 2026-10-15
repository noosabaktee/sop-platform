<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    /**
     * Query and paginate tenant audit events.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless(
            in_array($request->user()->role, ['super_admin', 'admin', 'manager', 'auditor'], true),
            403
        );

        $filter = $request->validate([
            'action' => ['nullable', 'string', 'max:100'],
            'entity_type' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

        $query = DB::table('audit_events as a')
            ->leftJoin('users as u', 'u.id', '=', 'a.actor_id')
            ->where('a.company_id', $request->user()->company_id);

        if (isset($filter['action'])) {
            $query->where('a.action', $filter['action']);
        }

        if (isset($filter['entity_type'])) {
            $query->where('a.entity_type', $filter['entity_type']);
        }

        if (isset($filter['from'])) {
            $query->whereDate('a.created_at', '>=', $filter['from']);
        }

        if (isset($filter['to'])) {
            $query->whereDate('a.created_at', '<=', $filter['to']);
        }

        $events = $query->orderByDesc('a.created_at')
            ->select([
                'a.id',
                'a.action',
                'a.entity_type',
                'a.entity_id',
                'a.ip_address',
                'a.created_at',
                'u.name as actor',
            ])
            ->paginate($filter['per_page'] ?? 50);

        return response()->json($events);
    }
}
