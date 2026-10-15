<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $t) {
            $t->foreignUlid('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $t->string('department_name')->nullable();
            $t->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
