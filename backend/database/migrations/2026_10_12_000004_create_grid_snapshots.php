<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('grid_snapshots', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('company_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('updated_by')->nullable()->constrained('users');
            $table->string('route', 120);
            $table->string('panel_id', 120);
            $table->jsonb('rows');
            $table->unsignedBigInteger('version')->default(1);
            $table->timestampsTz();
            $table->unique(['company_id', 'route', 'panel_id'], 'grid_snapshots_company_route_panel_unique');
        });
    }
    public function down(): void { Schema::dropIfExists('grid_snapshots'); }
};
