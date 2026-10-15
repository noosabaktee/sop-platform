<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('documents', function (Blueprint $t) {
            $t->foreignUlid('approved_by')->nullable()->constrained('users');
            $t->timestampTz('approved_at')->nullable();
            $t->text('rejection_reason')->nullable();
        });

        Schema::table('document_versions', function (Blueprint $t) {
            $t->timestampTz('verified_at')->nullable();
            $t->boolean('is_verified')->default(false);
        });
    }

    public function down(): void {
        Schema::table('document_versions', function (Blueprint $t) {
            $t->dropColumn(['verified_at', 'is_verified']);
        });

        Schema::table('documents', function (Blueprint $t) {
            $t->dropForeign(['approved_by']);
            $t->dropColumn(['approved_by', 'approved_at', 'rejection_reason']);
        });
    }
};

