<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('customer_id')->constrained();
            $t->foreignUlid('owner_id')->constrained('users');
            $t->string('number');
            $t->string('status')->default('draft');
            $t->char('currency', 3)->default('IDR');
            $t->decimal('subtotal', 20, 2)->default(0);
            $t->decimal('tax', 20, 2)->default(0);
            $t->decimal('total', 20, 2)->default(0);
            $t->date('valid_until')->nullable();
            $t->unsignedInteger('version')->default(1);
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
            $t->index(['company_id', 'status']);
        });
        Schema::create('quotation_items', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('quotation_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('product_id')->nullable()->constrained();
            $t->string('description');
            $t->decimal('quantity', 16, 4);
            $t->decimal('unit_price', 20, 2);
            $t->decimal('discount', 20, 2)->default(0);
            $t->decimal('line_total', 20, 2);
            $t->timestampsTz();
        });
        Schema::create('sales_orders', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('quotation_id')->nullable()->constrained();
            $t->foreignUlid('customer_id')->constrained();
            $t->string('number');
            $t->string('status')->default('draft');
            $t->decimal('total', 20, 2);
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
        });
        Schema::create('invoices', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('sales_order_id')->nullable()->constrained();
            $t->foreignUlid('customer_id')->constrained();
            $t->string('number');
            $t->decimal('amount', 20, 2);
            $t->decimal('paid_amount', 20, 2)->default(0);
            $t->string('status')->default('draft');
            $t->date('due_date')->nullable();
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
        });
        Schema::create('payments', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('invoice_id')->constrained();
            $t->string('number');
            $t->decimal('amount', 20, 2);
            $t->date('paid_at');
            $t->string('reference')->nullable();
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
        });
        Schema::create('projects', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('customer_id')->constrained();
            $t->foreignUlid('manager_id')->constrained('users');
            $t->string('code');
            $t->string('name');
            $t->string('status')->default('planning');
            $t->date('started_at')->nullable();
            $t->date('due_at')->nullable();
            $t->decimal('contract_value', 20, 2)->default(0);
            $t->decimal('budget', 20, 2)->default(0);
            $t->timestampsTz();
            $t->unique(['company_id', 'code']);
        });
        Schema::create('project_tasks', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('project_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('parent_id')->nullable()->index();
            $t->foreignUlid('assignee_id')->nullable()->constrained('users');
            $t->string('title');
            $t->string('status')->default('todo');
            $t->unsignedTinyInteger('progress')->default(0);
            $t->date('due_at')->nullable();
            $t->timestampsTz();
        });
        // PostgreSQL: self-reference added after project_tasks PK/unique index exists.
        Schema::table('project_tasks', function (Blueprint $t) {
            $t->foreign('parent_id', 'project_tasks_parent_id_foreign')->references('id')->on('project_tasks')->nullOnDelete();
        });
        Schema::create('purchase_requests', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('requester_id')->constrained('users');
            $t->foreignUlid('project_id')->nullable()->constrained();
            $t->string('number');
            $t->string('status')->default('draft');
            $t->decimal('estimated_total', 20, 2)->default(0);
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
        });
        Schema::create('purchase_orders', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('purchase_request_id')->nullable()->constrained();
            $t->foreignUlid('vendor_id')->constrained();
            $t->string('number');
            $t->string('status')->default('draft');
            $t->decimal('total', 20, 2);
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
        });
        Schema::create('inventory_movements', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('product_id')->constrained();
            $t->foreignUlid('warehouse_id')->constrained();
            $t->foreignUlid('actor_id')->nullable()->constrained('users');
            $t->decimal('quantity', 18, 4);
            $t->decimal('unit_cost', 20, 2)->default(0);
            $t->string('movement_type');
            $t->string('reference')->nullable();
            $t->timestampTz('posted_at');
            $t->timestampsTz();
            $t->index(['company_id', 'product_id', 'warehouse_id']);
        });
        Schema::create('chart_of_accounts', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('code');
            $t->string('name');
            $t->string('type');
            $t->timestampsTz();
            $t->unique(['company_id', 'code']);
        });
        Schema::create('journal_entries', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('number');
            $t->date('posting_date');
            $t->string('status')->default('draft');
            $t->text('description')->nullable();
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
        });
        Schema::create('journal_lines', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('journal_entry_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('account_id')->constrained('chart_of_accounts');
            $t->decimal('debit', 20, 2)->default(0);
            $t->decimal('credit', 20, 2)->default(0);
            $t->timestampsTz();
        });
    }

    public function down(): void
    {
        foreach (['journal_lines', 'journal_entries', 'chart_of_accounts', 'inventory_movements', 'purchase_orders', 'purchase_requests', 'project_tasks', 'projects', 'payments', 'invoices', 'sales_orders', 'quotation_items', 'quotations'] as $name) {
            Schema::dropIfExists($name);
        }
    }
};
