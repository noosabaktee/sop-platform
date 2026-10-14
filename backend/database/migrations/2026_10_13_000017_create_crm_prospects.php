<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('name');
            $table->timestampTz('converted_at')->nullable()->after('status');
        });
        Schema::create('prospects', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('segment')->default('Mid');
            $table->unsignedTinyInteger('fit_score')->default(0);
            $table->string('next_action')->nullable();
            $table->string('status')->default('Qualified');
            $table->timestampsTz();
            $table->unique(['company_id','lead_id']);
            $table->index(['company_id','status']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('prospects');
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['company_name','converted_at']);
        });
    }
};
