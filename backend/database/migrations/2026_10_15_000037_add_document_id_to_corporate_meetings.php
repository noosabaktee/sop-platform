<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('corporate_meetings', function (Blueprint $t) {
            $t->foreignUlid('document_id')->nullable()->constrained('documents')->nullOnDelete();
        });
    }

    public function down(): void {
        Schema::table('corporate_meetings', function (Blueprint $t) {
            $t->dropForeign(['document_id']);
            $t->dropColumn('document_id');
        });
    }
};

