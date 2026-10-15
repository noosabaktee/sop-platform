<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Module State Controller:
 * Native prototype state collections stored in company-scoped PostgreSQL JSONB.
 * This is NOT a replacement for normalized business operations or external providers.
 */
class ModuleStateController extends Controller
{
    private const ROUTES = [
        '/document-management',
        '/document-template',
        '/email-communication',
        '/omnichannel',
        '/whatsapp-integration',
        '/general-meeting-rups',
        '/workflow-approval',
        '/corporate',
        '/ai-assistant',
        '/data-intelligence',
        '/integrations',
        '/security-audit',
        '/settings',
    ];

    private const PRIVILEGED = [
        '/settings',
        '/integrations',
        '/security-audit',
    ];

    /**
     * Get module states for the current company.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('module_states')->where('company_id', $request->user()->company_id);

        if (! in_array($request->user()->role, ['super_admin', 'admin'], true)) {
            $query->whereNotIn('route', self::PRIVILEGED);
        }

        $states = $query
            ->get(['route', 'section', 'payload', 'version', 'updated_at'])
            ->map(fn ($row) => [
                'route' => $row->route,
                'section' => $row->section,
                'payload' => json_decode($row->payload, true),
                'version' => $row->version,
                'updated_at' => $row->updated_at,
            ]);

        return response()->json([
            'data' => $states,
        ]);
    }

    /**
     * Save or seed module states with optimistic locking and tenant scoping.
     */
    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'states' => ['required', 'array', 'min:1', 'max:30'],
            'states.*.route' => ['required', 'string', 'in:'.implode(',', self::ROUTES)],
            'states.*.section' => ['required', 'string', 'regex:/^[a-z0-9_.-]+$/', 'max:120'],
            'states.*.payload' => ['required', 'array'],
            'states.*.version' => ['nullable', 'integer', 'min:1'],
            'seed_only' => ['sometimes', 'boolean'],
        ]);

        $seedOnly = (bool) ($data['seed_only'] ?? false);
        $companyId = $request->user()->company_id;

        $result = DB::transaction(function () use ($request, $data, $companyId, $seedOnly) {
            $output = [];

            foreach ($data['states'] as $state) {
                if (in_array($state['route'], self::PRIVILEGED, true) && ! in_array($request->user()->role, ['super_admin', 'admin'], true)) {
                    abort(403, 'Tidak diizinkan mengubah konfigurasi perusahaan.');
                }

                // Prevent someone overwriting a different section or route by supplying duplicates.
                if (isset($output[$state['route'].'|'.$state['section']])) {
                    throw ValidationException::withMessages(['states' => 'Duplicate module state.']);
                }

                $query = DB::table('module_states')
                    ->where('company_id', $companyId)
                    ->where('route', $state['route'])
                    ->where('section', $state['section']);

                $existing = $query->lockForUpdate()->first();

                if ($existing) {
                    if (! $seedOnly) {
                        if (! isset($state['version']) || (int) $state['version'] !== (int) $existing->version) {
                            abort(409, 'Data berubah di sesi lain, silakan refresh.');
                        }

                        $query->update([
                            'payload' => json_encode($state['payload'], JSON_THROW_ON_ERROR),
                            'updated_by' => $request->user()->id,
                            'version' => $existing->version + 1,
                            'updated_at' => now(),
                        ]);

                        AuditService::record(
                            $request->user(),
                            'module_state.updated',
                            'module_state',
                            $existing->id,
                            ['route' => $state['route'], 'section' => $state['section']],
                            ['version' => $existing->version + 1]
                        );
                    }
                    $version = (int) $existing->version + ($seedOnly ? 0 : 1);
                } else {
                    $id = (string) Str::ulid();
                    $version = 1;

                    DB::table('module_states')->insert([
                        'id' => $id,
                        'company_id' => $companyId,
                        'route' => $state['route'],
                        'section' => $state['section'],
                        'payload' => json_encode($state['payload'], JSON_THROW_ON_ERROR),
                        'version' => 1,
                        'updated_by' => $request->user()->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    if (! $seedOnly) {
                        AuditService::record(
                            $request->user(),
                            'module_state.created',
                            'module_state',
                            $id,
                            null,
                            ['route' => $state['route'], 'section' => $state['section']]
                        );
                    }
                }

                $output[$state['route'].'|'.$state['section']] = [
                    'route' => $state['route'],
                    'section' => $state['section'],
                    'version' => $version,
                ];
            }

            return array_values($output);
        });

        return response()->json([
            'data' => $result,
        ]);
    }
}
