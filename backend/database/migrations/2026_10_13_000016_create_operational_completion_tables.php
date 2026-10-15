<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocktakes', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('warehouse_id')->constrained();
            $t->foreignUlid('created_by')->constrained('users');
            $t->foreignUlid('posted_by')->nullable()->constrained('users');
            $t->string('number');
            $t->string('status')->default('counting');
            $t->timestampTz('snapshot_at');
            $t->timestampTz('posted_at')->nullable();
            $t->text('note')->nullable();
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
        });
        Schema::create('stocktake_lines', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('stocktake_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('product_id')->constrained();
            $t->decimal('expected_qty', 18, 4);
            $t->decimal('counted_qty', 18, 4)->nullable();
            $t->foreignUlid('counted_by')->nullable()->constrained('users');
            $t->timestampTz('counted_at')->nullable();
            $t->timestampsTz();
            $t->unique(['stocktake_id', 'product_id']);
        });
        Schema::create('project_costs', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('project_id')->constrained();
            $t->foreignUlid('created_by')->constrained('users');
            $t->string('reference');
            $t->date('cost_date');
            $t->string('category', 40);
            $t->string('description');
            $t->decimal('amount', 20, 2);
            $t->timestampsTz();
            $t->unique(['company_id', 'reference']);
        });
        Schema::create('bank_accounts', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('coa_id')->constrained('chart_of_accounts');
            $t->string('name');
            $t->string('account_number')->nullable();
            $t->string('currency', 3)->default('IDR');
            $t->timestampsTz();
            $t->unique(['company_id', 'name']);
        });
        Schema::create('bank_statement_lines', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('bank_account_id')->constrained();
            $t->string('reference');
            $t->date('value_date');
            $t->text('description')->nullable();
            $t->decimal('amount', 20, 2);
            $t->foreignUlid('journal_line_id')->nullable()->unique()->constrained('journal_lines');
            $t->foreignUlid('matched_by')->nullable()->constrained('users');
            $t->timestampTz('matched_at')->nullable();
            $t->timestampsTz();
            $t->unique(['bank_account_id', 'reference']);
        });
        Schema::create('corporate_meetings', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('created_by')->constrained('users');
            $t->string('kind')->default('general');
            $t->string('title');
            $t->timestampTz('starts_at');
            $t->string('location')->nullable();
            $t->string('status')->default('draft');
            $t->unsignedBigInteger('total_shares')->default(0);
            $t->unsignedBigInteger('present_shares')->default(0);
            $t->text('minutes')->nullable();
            $t->timestampsTz();
        });
        Schema::create('corporate_resolutions', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('meeting_id')->constrained('corporate_meetings');
            $t->string('title');
            $t->text('description')->nullable();
            $t->unsignedBigInteger('for_votes');
            $t->unsignedBigInteger('against_votes');
            $t->unsignedBigInteger('abstain_votes')->default(0);
            $t->string('status');
            $t->timestampsTz();
        });
        Schema::create('outbound_messages', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('requested_by')->constrained('users');
            $t->string('channel', 32);
            $t->string('recipient');
            $t->text('subject')->nullable();
            $t->longText('content');
            $t->string('idempotency_key', 120);
            $t->string('status')->default('pending');
            $t->string('provider_reference')->nullable();
            $t->text('error_message')->nullable();
            $t->timestampTz('sent_at')->nullable();
            $t->timestampsTz();
            $t->unique(['company_id', 'channel', 'idempotency_key'], 'outbound_idempotency_unique');
        });
    }

    public function down(): void
    {
        foreach (['outbound_messages', 'corporate_resolutions', 'corporate_meetings', 'bank_statement_lines', 'bank_accounts', 'project_costs', 'stocktake_lines', 'stocktakes'] as $name) {
            Schema::dropIfExists($name);
        }
    }
};
