<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {
  Schema::create('module_states',function(Blueprint $table){
   $table->ulid('id')->primary();
   $table->foreignUlid('company_id')->constrained('companies')->cascadeOnDelete();
   $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
   $table->string('route',120);$table->string('section',120);
   $table->jsonb('payload');$table->unsignedInteger('version')->default(1);
   $table->timestampsTz();
   $table->unique(['company_id','route','section']);
  });
 }
 public function down():void {Schema::dropIfExists('module_states');}
};
