<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up():void {
  Schema::create('transaction_approvals',function(Blueprint $t){
   $t->ulid('id')->primary();
   $t->foreignUlid('company_id')->constrained();
   $t->string('subject_type',32);
   $t->ulid('subject_id');
   $t->foreignUlid('requester_id')->constrained('users');
   $t->foreignUlid('approver_id')->nullable()->constrained('users');
   $t->string('status',24)->default('pending');
   $t->text('comment')->nullable();
   $t->timestampTz('decided_at')->nullable();
   $t->timestampsTz();
   $t->index(['company_id','subject_type','subject_id']);
  });
  DB::statement("CREATE UNIQUE INDEX transaction_approvals_one_pending ON transaction_approvals (company_id, subject_type, subject_id) WHERE status = 'pending'");
  Schema::table('sales_orders',function(Blueprint $t){
   $t->unique('quotation_id','sales_orders_one_per_quotation');
  });
  Schema::table('invoices',function(Blueprint $t){
   $t->unique('sales_order_id','invoices_one_per_sales_order');
  });
  Schema::table('payments',function(Blueprint $t){
   $t->string('idempotency_key',100)->nullable();
   $t->unique(['company_id','idempotency_key'],'payments_company_idempotency_unique');
  });
 }
 public function down():void {
  Schema::table('payments',function(Blueprint $t){$t->dropUnique('payments_company_idempotency_unique');$t->dropColumn('idempotency_key');});
  Schema::table('invoices',fn(Blueprint $t)=>$t->dropUnique('invoices_one_per_sales_order'));
  Schema::table('sales_orders',fn(Blueprint $t)=>$t->dropUnique('sales_orders_one_per_quotation'));
  Schema::dropIfExists('transaction_approvals');
 }
};
