<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_movements', function (Blueprint $t) {
            $t->string('idempotency_key', 100)->nullable();
            $t->unique(['company_id', 'idempotency_key'], 'movement_company_idempotency_unique');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $t) {
            $t->dropUnique('movement_company_idempotency_unique');
            $t->dropColumn('idempotency_key');
        });
    }
};
