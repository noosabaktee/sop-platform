<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_deliveries', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('sales_order_id')->constrained();
            $t->foreignUlid('warehouse_id')->constrained();
            $t->foreignUlid('created_by')->constrained('users');
            $t->string('number');
            $t->string('status')->default('delivered');
            $t->timestampTz('delivered_at');
            $t->string('idempotency_key', 100);
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
            $t->unique(['company_id', 'idempotency_key']);
            $t->unique('sales_order_id');
        });
        Schema::create('sales_delivery_lines', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('sales_delivery_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('product_id')->constrained();
            $t->decimal('quantity', 18, 4);
            $t->decimal('unit_cost', 20, 2);
            $t->timestampsTz();
            $t->unique(['sales_delivery_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_delivery_lines');
        Schema::dropIfExists('sales_deliveries');
    }
};
