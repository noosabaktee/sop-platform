<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_bills', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('goods_receipt_id')->constrained();
            $t->foreignUlid('vendor_id')->constrained();
            $t->foreignUlid('posted_by')->constrained('users');
            $t->string('number');
            $t->decimal('amount', 20, 2);
            $t->decimal('paid_amount', 20, 2)->default(0);
            $t->string('status')->default('posted');
            $t->date('due_date')->nullable();
            $t->string('idempotency_key', 100);
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
            $t->unique('goods_receipt_id');
            $t->unique(['company_id', 'idempotency_key']);
        });
        Schema::create('vendor_payments', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('vendor_bill_id')->constrained();
            $t->foreignUlid('bank_account_id')->nullable()->constrained();
            $t->foreignUlid('paid_by')->constrained('users');
            $t->string('number');
            $t->decimal('amount', 20, 2);
            $t->date('paid_at');
            $t->string('reference')->nullable();
            $t->string('idempotency_key', 100);
            $t->timestampsTz();
            $t->unique(['company_id', 'number']);
            $t->unique(['company_id', 'idempotency_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_payments');
        Schema::dropIfExists('vendor_bills');
    }
};
