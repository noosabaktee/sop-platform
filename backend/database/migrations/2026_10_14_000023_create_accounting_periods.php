<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {Schema::create('accounting_periods',function(Blueprint $t){
  $t->ulid('id')->primary();$t->foreignUlid('company_id')->constrained();$t->date('starts_on');$t->date('ends_on');
  $t->string('status')->default('closed');$t->foreignUlid('closed_by')->constrained('users');$t->timestampTz('closed_at');
  $t->foreignUlid('reopened_by')->nullable()->constrained('users');$t->timestampTz('reopened_at')->nullable();$t->text('note')->nullable();$t->timestampsTz();
  $t->unique(['company_id','starts_on','ends_on']);$t->index(['company_id','status','starts_on','ends_on']);
 });}
 public function down():void {Schema::dropIfExists('accounting_periods');}
};
