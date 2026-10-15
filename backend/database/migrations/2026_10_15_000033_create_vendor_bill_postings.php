<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_bill_postings', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('vendor_bill_id')->constrained();
            $t->string('idempotency_key', 100);
            $t->decimal('amount', 20, 2);
            $t->timestampsTz();
            $t->unique(['company_id', 'idempotency_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_bill_postings');
    }
};
