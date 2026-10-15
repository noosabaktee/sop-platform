<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {
  Schema::create('sales_returns',function(Blueprint $t){
   $t->ulid('id')->primary();$t->foreignUlid('company_id')->constrained();$t->foreignUlid('sales_delivery_id')->constrained();
   $t->foreignUlid('warehouse_id')->constrained();$t->foreignUlid('created_by')->constrained('users');$t->string('number');
   $t->string('status')->default('received');$t->text('reason');$t->timestampTz('received_at');$t->string('idempotency_key',100);
   $t->timestampsTz();$t->unique(['company_id','number']);$t->unique(['company_id','idempotency_key']);$t->unique('sales_delivery_id');
  });
  Schema::create('sales_return_lines',function(Blueprint $t){
   $t->ulid('id')->primary();$t->foreignUlid('sales_return_id')->constrained()->cascadeOnDelete();$t->foreignUlid('product_id')->constrained();
   $t->decimal('quantity',18,4);$t->decimal('unit_cost',20,2);$t->timestampsTz();$t->unique(['sales_return_id','product_id']);
  });
 }
 public function down():void {Schema::dropIfExists('sales_return_lines');Schema::dropIfExists('sales_returns');}
};
