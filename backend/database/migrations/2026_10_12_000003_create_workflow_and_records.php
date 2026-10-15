<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_records', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('created_by')->nullable()->constrained('users');
            $t->foreignUlid('updated_by')->nullable()->constrained('users');
            $t->string('route', 120);
            $t->string('view_key', 40);
            $t->unsignedInteger('table_index')->default(0);
            $t->jsonb('cells');
            $t->jsonb('fields');
            $t->string('status')->default('draft');
            $t->unsignedInteger('version')->default(1);
            $t->softDeletesTz();
            $t->timestampsTz();
            $t->index(['company_id', 'route', 'view_key', 'table_index'], 'business_records_view_lookup');
        });
        Schema::create('approvals', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('business_record_id')->constrained('business_records');
            $t->foreignUlid('requester_id')->nullable()->constrained('users');
            $t->foreignUlid('approver_id')->nullable()->constrained('users');
            $t->string('status')->default('pending');
            $t->text('comment')->nullable();
            $t->timestampTz('decided_at')->nullable();
            $t->timestampsTz();
            $t->index(['company_id', 'status']);
        });
        Schema::create('audit_events', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('actor_id')->nullable()->constrained('users');
            $t->string('action', 100);
            $t->string('entity_type', 100);
            $t->string('entity_id', 50);
            $t->jsonb('before_data')->nullable();
            $t->jsonb('after_data')->nullable();
            $t->ipAddress('ip_address')->nullable();
            $t->timestampTz('created_at')->useCurrent();
            $t->index(['company_id', 'entity_type', 'entity_id']);
        });
        Schema::create('notifications', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('type');
            $t->ulidMorphs('notifiable');
            $t->text('data');
            $t->timestampTz('read_at')->nullable();
            $t->timestampsTz();
        });
        Schema::create('documents', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('owner_id')->constrained('users');
            $t->string('title');
            $t->string('storage_path');
            $t->string('mime_type')->nullable();
            $t->unsignedInteger('version')->default(1);
            $t->string('status')->default('draft');
            $t->timestampsTz();
        });
    }

    public function down(): void
    {
        foreach (['documents', 'notifications', 'audit_events', 'approvals', 'business_records'] as $name) {
            Schema::dropIfExists($name);
        }
    }
};
