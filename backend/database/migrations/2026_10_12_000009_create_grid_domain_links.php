<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {
  Schema::create('grid_domain_links',function(Blueprint $t){
   $t->foreignUlid('grid_row_id')->primary()->constrained('grid_rows')->cascadeOnDelete();
   $t->foreignUlid('company_id')->constrained();
   $t->string('domain_table',60);$t->ulid('domain_id');
   $t->boolean('archived')->default(false);
   $t->timestampsTz();
   $t->index(['company_id','domain_table','domain_id']);
  });
 }
 public function down():void {Schema::dropIfExists('grid_domain_links');}
};
