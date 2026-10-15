<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['products', 'warehouses', 'departments'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->boolean('is_active')->default(true)->index());
        }
    }

    public function down(): void
    {
        foreach (['products', 'warehouses', 'departments'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->dropColumn('is_active'));
        }
    }
};
