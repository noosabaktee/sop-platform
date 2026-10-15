<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {Schema::table('projects',function(Blueprint $t){$t->foreignUlid('opportunity_id')->nullable()->unique()->constrained('opportunities');});}
 public function down():void {Schema::table('projects',function(Blueprint $t){$t->dropForeign(['opportunity_id']);$t->dropUnique(['opportunity_id']);$t->dropColumn('opportunity_id');});}
};
