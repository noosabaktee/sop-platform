<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('warehouse_transfers', function(Blueprint $t) {
   $t->ulid('id')->primary();
   $t->foreignUlid('company_id')->constrained();
   $t->foreignUlid('product_id')->constrained();
   $t->foreignUlid('from_warehouse_id')->constrained('warehouses');
   $t->foreignUlid('to_warehouse_id')->constrained('warehouses');
   $t->foreignUlid('requested_by')->constrained('users');
   $t->foreignUlid('shipped_by')->nullable()->constrained('users');
   $t->foreignUlid('received_by')->nullable()->constrained('users');
   $t->string('number');$t->string('idempotency_key',100);
   $t->decimal('quantity',18,4);
   $t->decimal('unit_cost',20,2)->default(0);
   $t->string('status',20)->default('draft');
   $t->text('note')->nullable();
   $t->timestampTz('shipped_at')->nullable();
   $t->timestampTz('received_at')->nullable();
   $t->timestampsTz();
   $t->unique(['company_id','number']);
   $t->unique(['company_id','idempotency_key'],'warehouse_transfers_idempotent');
   $t->index(['company_id','status']);
  });
 }
 public function down(): void { Schema::dropIfExists('warehouse_transfers'); }
};
