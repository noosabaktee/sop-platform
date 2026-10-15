<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_request_lines', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('purchase_request_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('product_id')->constrained();
            $t->decimal('quantity', 18, 4);
            $t->decimal('unit_price', 20, 2);
            $t->timestampsTz();
        });
        Schema::create('purchase_order_lines', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('purchase_order_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('product_id')->constrained();
            $t->decimal('quantity', 18, 4);
            $t->decimal('received_quantity', 18, 4)->default(0);
            $t->decimal('unit_price', 20, 2);
            $t->timestampsTz();
        });
        Schema::create('goods_receipts', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('purchase_order_id')->constrained();
            $t->foreignUlid('warehouse_id')->constrained();
            $t->foreignUlid('received_by')->constrained('users');
            $t->string('number');
            $t->string('reference', 120)->nullable();
            $t->date('received_at');
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
            $t->unique(['company_id', 'purchase_order_id', 'reference'], 'goods_receipts_unique_reference');
        });
        Schema::create('goods_receipt_lines', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('goods_receipt_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('purchase_order_line_id')->constrained();
            $t->foreignUlid('product_id')->constrained();
            $t->decimal('quantity', 18, 4);
            $t->decimal('unit_cost', 20, 2);
            $t->timestampsTz();
        });
        Schema::create('purchase_returns', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('goods_receipt_line_id')->constrained();
            $t->foreignUlid('actor_id')->constrained('users');
            $t->decimal('quantity', 18, 4);
            $t->string('reason', 500);
            $t->timestampsTz();
        });
        Schema::table('inventory_movements', function (Blueprint $t) {
            $t->string('source_type', 60)->nullable();
            $t->ulid('source_id')->nullable();
            $t->unique(['company_id', 'source_type', 'source_id'], 'movements_company_source_unique');
        });
        Schema::table('journal_entries', function (Blueprint $t) {
            $t->string('source_type', 60)->nullable();
            $t->ulid('source_id')->nullable();
            $t->unique(['company_id', 'source_type', 'source_id'], 'journal_company_source_unique');
        });
        Schema::create('document_versions', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('document_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('version');
            $t->foreignUlid('uploaded_by')->constrained('users');
            $t->string('storage_path');
            $t->string('original_name');
            $t->string('mime_type');
            $t->unsignedBigInteger('byte_size');
            $t->char('sha256', 64);
            $t->timestampsTz();
            $t->unique(['document_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_versions');
        Schema::table('journal_entries', function (Blueprint $t) {
            $t->dropUnique('journal_company_source_unique');
            $t->dropColumn(['source_type', 'source_id']);
        });
        Schema::table('inventory_movements', function (Blueprint $t) {
            $t->dropUnique('movements_company_source_unique');
            $t->dropColumn(['source_type', 'source_id']);
        });
        foreach (['purchase_returns', 'goods_receipt_lines', 'goods_receipts', 'purchase_order_lines', 'purchase_request_lines'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
