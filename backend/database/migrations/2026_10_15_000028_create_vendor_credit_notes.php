<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up():void {
  Schema::create('vendor_credit_notes',function(Blueprint $t){
   $t->ulid('id')->primary();$t->foreignUlid('company_id')->constrained();$t->foreignUlid('purchase_return_id')->constrained();$t->foreignUlid('vendor_bill_id')->constrained();$t->foreignUlid('posted_by')->constrained('users');
   $t->string('number');$t->decimal('amount',20,2);$t->string('status')->default('posted');$t->timestampsTz();
   $t->unique('purchase_return_id');$t->unique(['company_id','number']);
  });
 }
 public function down():void {Schema::dropIfExists('vendor_credit_notes');}
};
