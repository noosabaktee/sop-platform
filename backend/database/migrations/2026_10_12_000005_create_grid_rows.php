<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grid_rows', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('grid_snapshot_id')->constrained('grid_snapshots')->cascadeOnDelete();
            $table->string('row_key', 160);
            $table->jsonb('payload');
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('version')->default(1);
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletesTz();
            $table->timestampsTz();
            $table->unique(['grid_snapshot_id', 'row_key']);
            $table->index(['company_id', 'grid_snapshot_id', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grid_rows');
    }
};
