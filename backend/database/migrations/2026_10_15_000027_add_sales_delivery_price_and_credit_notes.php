<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::table('sales_delivery_lines',function(Blueprint $t){$t->decimal('unit_price',20,2)->nullable()->after('unit_cost');});
  Schema::create('credit_notes',function(Blueprint $t){
   $t->ulid('id')->primary();$t->foreignUlid('company_id')->constrained();$t->foreignUlid('sales_return_id')->constrained();$t->foreignUlid('invoice_id')->constrained();$t->foreignUlid('posted_by')->constrained('users');
   $t->string('number');$t->decimal('net_amount',20,2);$t->decimal('tax_amount',20,2)->default(0);$t->decimal('amount',20,2);$t->string('status')->default('posted');$t->timestampsTz();
   $t->unique('sales_return_id');$t->unique(['company_id','number']);
  });
 }
 public function down(): void {Schema::dropIfExists('credit_notes');Schema::table('sales_delivery_lines',function(Blueprint $t){$t->dropColumn('unit_price');});}
};
