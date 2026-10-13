<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('quotations', function(Blueprint $table) {
            $table->string('contact_name')->nullable();
            $table->string('payment_terms', 100)->nullable();
            $table->decimal('discount_total', 20, 2)->default(0);
        });
    }
    public function down(): void {
        Schema::table('quotations', fn(Blueprint $table) => $table->dropColumn(['contact_name','payment_terms','discount_total']));
    }
};
