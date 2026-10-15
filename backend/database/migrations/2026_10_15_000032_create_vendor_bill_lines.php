<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up():void {
  Schema::create('vendor_bill_lines',function(Blueprint $t){
   $t->ulid('id')->primary();$t->foreignUlid('vendor_bill_id')->constrained()->cascadeOnDelete();$t->foreignUlid('goods_receipt_line_id')->constrained();
   $t->decimal('quantity',18,4);$t->decimal('unit_cost',20,2);$t->decimal('amount',20,2);$t->timestampsTz();
   $t->index('goods_receipt_line_id');
  });
 }
 public function down():void {Schema::dropIfExists('vendor_bill_lines');}
};
