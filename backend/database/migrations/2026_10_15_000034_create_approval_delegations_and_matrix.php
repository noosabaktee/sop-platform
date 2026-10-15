<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_delegations', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('delegator_id')->constrained('users');
            $t->foreignUlid('delegatee_id')->constrained('users');
            $t->string('scope', 32)->default('all');
            $t->timestampTz('start_date');
            $t->timestampTz('end_date');
            $t->text('reason')->nullable();
            $t->string('status', 24)->default('active');
            $t->timestampsTz();

            $t->index(['company_id', 'status', 'start_date', 'end_date'], 'appr_delegations_active_idx');
            $t->index(['company_id', 'delegatee_id'], 'appr_delegations_delegatee_idx');
            $t->index(['company_id', 'delegator_id'], 'appr_delegations_delegator_idx');
        });

        Schema::create('approval_matrices', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('subject_type', 32)->default('all');
            $t->string('condition_label', 100);
            $t->decimal('min_amount', 18, 4)->default(0);
            $t->decimal('max_amount', 18, 4)->nullable();
            $t->string('required_role', 50);
            $t->integer('level')->default(1);
            $t->integer('sla_hours')->default(24);
            $t->timestampsTz();

            $t->index(['company_id', 'subject_type'], 'appr_matrices_company_subject_idx');
        });

        Schema::table('transaction_approvals', function (Blueprint $t) {
            $t->foreignUlid('delegated_from_id')->nullable()->constrained('users');
            $t->integer('tier')->default(1);
            $t->timestampTz('due_at')->nullable();
            $t->boolean('is_escalated')->default(false);
            $t->timestampTz('escalated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('transaction_approvals', function (Blueprint $t) {
            $t->dropForeign(['delegated_from_id']);
            $t->dropColumn(['delegated_from_id', 'tier', 'due_at', 'is_escalated', 'escalated_at']);
        });
        Schema::dropIfExists('approval_matrices');
        Schema::dropIfExists('approval_delegations');
    }
};
