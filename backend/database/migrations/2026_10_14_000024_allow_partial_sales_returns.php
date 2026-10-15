<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_returns', fn (Blueprint $t) => $t->dropUnique('sales_returns_sales_delivery_id_unique'));
    }

    public function down(): void
    {
        Schema::table('sales_returns', fn (Blueprint $t) => $t->unique('sales_delivery_id'));
    }
};
