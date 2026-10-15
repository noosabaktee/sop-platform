<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_refunds', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('credit_note_id')->constrained();
            $t->foreignUlid('invoice_id')->constrained();
            $t->foreignUlid('refunded_by')->constrained('users');
            $t->string('number');
            $t->decimal('amount', 20, 2);
            $t->string('status')->default('posted');
            $t->timestampsTz();
            $t->unique('credit_note_id');
            $t->unique(['company_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_refunds');
    }
};
