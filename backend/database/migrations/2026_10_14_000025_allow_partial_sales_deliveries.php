<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_deliveries', fn (Blueprint $t) => $t->dropUnique('sales_deliveries_sales_order_id_unique'));
    }

    public function down(): void
    {
        Schema::table('sales_deliveries', fn (Blueprint $t) => $t->unique('sales_order_id'));
    }
};
