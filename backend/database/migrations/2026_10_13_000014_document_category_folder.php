<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void{Schema::table('documents',function(Blueprint $t){
  $t->string('category',30)->default('all');$t->string('folder',150)->nullable();
  $t->index(['company_id','category','folder'],'documents_company_category_folder');
 });}
 public function down():void{Schema::table('documents',function(Blueprint $t){
  $t->dropIndex('documents_company_category_folder');$t->dropColumn(['category','folder']);
 });}
};
