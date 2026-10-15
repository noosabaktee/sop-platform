<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Real company-scoped user management.
 * Enforces company boundaries and prevents browser manipulation of company_id.
 */
class UserManagementController extends Controller
{
    /**
     * Authorize admin-level actions.
     */
    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['super_admin', 'admin'], true),
            403
        );
    }

    /**
     * Base query for tenant-scoped users joined with user profile info.
     */
    private function tenantUserQuery(Request $request): Builder
    {
        return DB::table('users as u')
            ->leftJoin('user_profiles as p', 'p.user_id', '=', 'u.id')
            ->where('u.company_id', $request->user()->company_id);
    }

    /**
     * List all users for the current company.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $users = $this->tenantUserQuery($request)
            ->orderBy('u.name')
            ->get([
                'u.id',
                'u.name',
                'u.email',
                'u.role',
                'u.is_active',
                'p.department_name',
            ]);

        return response()->json([
            'data' => $users,
        ]);
    }

    /**
     * Create a new company user.
     */
    public function create(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'role' => [
                'required',
                Rule::in([
                    'admin',
                    'manager',
                    'sales',
                    'finance',
                    'procurement',
                    'warehouse',
                    'project_manager',
                    'user',
                    'viewer',
                ]),
            ],
            'department_name' => ['nullable', 'string', 'max:150'],
            'password' => ['nullable', Password::min(12)->mixedCase()->numbers()],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        abort_if(
            $data['role'] === 'admin' && $request->user()->role !== 'super_admin',
            403,
            'Hanya super admin yang boleh membuat admin.'
        );

        return DB::transaction(function () use ($request, $data) {
            $id = (string) Str::ulid();
            $hasPassword = ! empty($data['password']);
            $active = $hasPassword && ($data['is_active'] ?? false);
            $now = now();

            DB::table('users')->insert([
                'id' => $id,
                'company_id' => $request->user()->company_id,
                'name' => $data['name'],
                'email' => mb_strtolower($data['email']),
                'role' => $data['role'],
                'password' => Hash::make($data['password'] ?? Str::random(72)),
                'is_active' => $active,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('user_profiles')->insert([
                'user_id' => $id,
                'department_name' => $data['department_name'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record(
                $request->user(),
                'user.created',
                'user',
                $id,
                null,
                [
                    'email' => $data['email'],
                    'role' => $data['role'],
                    'is_active' => $active,
                ]
            );

            $user = $this->tenantUserQuery($request)
                ->where('u.id', $id)
                ->first([
                    'u.id',
                    'u.name',
                    'u.email',
                    'u.role',
                    'u.is_active',
                    'p.department_name',
                ]);

            return response()->json([
                'data' => $user,
            ], 201);
        });
    }

    /**
     * Update an existing user's details or role.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'role' => [
                'sometimes',
                Rule::in([
                    'admin',
                    'manager',
                    'sales',
                    'finance',
                    'procurement',
                    'warehouse',
                    'project_manager',
                    'user',
                    'viewer',
                ]),
            ],
            'department_name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['sometimes', 'required', Password::min(12)->mixedCase()->numbers()],
        ]);

        return DB::transaction(function () use ($request, $data, $id) {
            $query = DB::table('users')
                ->where('company_id', $request->user()->company_id)
                ->where('id', $id);

            $before = $query->lockForUpdate()->first();
            abort_unless($before, 404);

            if ($id === $request->user()->id) {
                abort_if(
                    (isset($data['is_active']) && $data['is_active'] === false) ||
                    (isset($data['role']) && $data['role'] !== $before->role),
                    409,
                    'Tidak dapat menonaktifkan atau mengubah role akun sendiri.'
                );
            }

            if ($before->role === 'super_admin') {
                abort_unless($request->user()->role === 'super_admin', 403);
            }

            if (($data['role'] ?? null) === 'admin' && $request->user()->role !== 'super_admin') {
                abort(403, 'Hanya super admin yang dapat menetapkan role admin.');
            }

            $changes = array_intersect_key($data, array_flip(['name', 'email', 'role', 'is_active']));
            if (isset($changes['email'])) {
                $changes['email'] = mb_strtolower($changes['email']);
            }
            if (isset($data['password'])) {
                $changes['password'] = Hash::make($data['password']);
            }

            $query->update([...$changes, 'updated_at' => now()]);

            if (array_key_exists('department_name', $data)) {
                DB::table('user_profiles')->updateOrInsert(
                    ['user_id' => $id],
                    [
                        'department_name' => $data['department_name'],
                        'updated_at' => now(),
                    ]
                );
            }

            AuditService::record(
                $request->user(),
                'user.updated',
                'user',
                $id,
                [
                    'role' => $before->role,
                    'is_active' => $before->is_active,
                ],
                [
                    'role' => $data['role'] ?? $before->role,
                    'is_active' => $data['is_active'] ?? $before->is_active,
                ]
            );

            $user = $this->tenantUserQuery($request)
                ->where('u.id', $id)
                ->first([
                    'u.id',
                    'u.name',
                    'u.email',
                    'u.role',
                    'u.is_active',
                    'p.department_name',
                ]);

            return response()->json([
                'data' => $user,
            ]);
        });
    }

    /**
     * Deactivate a user account, terminating all active sessions and access tokens.
     */
    public function deactivate(Request $request, string $id): Response
    {
        $this->authorizeAdmin($request);
        abort_if($id === $request->user()->id, 409, 'Tidak dapat menonaktifkan diri sendiri.');

        return DB::transaction(function () use ($request, $id) {
            $query = DB::table('users')
                ->where('company_id', $request->user()->company_id)
                ->where('id', $id);

            $before = $query->lockForUpdate()->first();
            abort_unless($before, 404);

            if ($before->role === 'super_admin') {
                abort_unless($request->user()->role === 'super_admin', 403);
            }

            $query->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);

            DB::table('sessions')->where('user_id', $id)->delete();
            DB::table('personal_access_tokens')
                ->where('tokenable_type', 'App\\Models\\User')
                ->where('tokenable_id', $id)
                ->delete();

            AuditService::record(
                $request->user(),
                'user.deactivated',
                'user',
                $id,
                ['is_active' => $before->is_active],
                ['is_active' => false]
            );

            return response()->noContent();
        });
    }
}
