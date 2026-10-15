<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuditService
{
    public static function record(User $actor, string $action, string $entity, string $id, ?array $before = null, ?array $after = null): void
    {
        DB::table('audit_events')->insert(['id' => (string) Str::ulid(), 'company_id' => $actor->company_id, 'actor_id' => $actor->id, 'action' => $action, 'entity_type' => $entity, 'entity_id' => $id, 'before_data' => json_encode($before), 'after_data' => json_encode($after), 'ip_address' => request()->ip(), 'created_at' => now()]);
    }
}
