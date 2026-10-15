<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_costs', function (Blueprint $t) {
            $t->string('payment_method', 20)->default('cash');
            $t->foreignUlid('journal_entry_id')->nullable()->constrained('journal_entries');
        });
    }

    public function down(): void
    {
        Schema::table('project_costs', function (Blueprint $t) {
            $t->dropForeign(['journal_entry_id']);
            $t->dropColumn(['payment_method', 'journal_entry_id']);
        });
    }
};
