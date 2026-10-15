<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_movements', function (Blueprint $t) {
            $t->string('batch_number', 100)->nullable()->index();
            $t->string('serial_number', 100)->nullable()->index();
            $t->date('expiry_date')->nullable()->index();
        });

        Schema::table('goods_receipt_lines', function (Blueprint $t) {
            $t->string('batch_number', 100)->nullable()->index();
            $t->date('expiry_date')->nullable();
        });

        Schema::table('sales_delivery_lines', function (Blueprint $t) {
            $t->string('batch_number', 100)->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('sales_delivery_lines', function (Blueprint $t) {
            $t->dropIndex(['batch_number']);
            $t->dropColumn('batch_number');
        });

        Schema::table('goods_receipt_lines', function (Blueprint $t) {
            $t->dropIndex(['batch_number']);
            $t->dropColumn(['batch_number', 'expiry_date']);
        });

        Schema::table('inventory_movements', function (Blueprint $t) {
            $t->dropIndex(['batch_number']);
            $t->dropIndex(['serial_number']);
            $t->dropIndex(['expiry_date']);
            $t->dropColumn(['batch_number', 'serial_number', 'expiry_date']);
        });
    }
};
