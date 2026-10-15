<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->string('code')->unique();
            $t->string('name');
            $t->char('currency', 3)->default('IDR');
            $t->timestampsTz();
        });
        Schema::create('users', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('name');
            $t->string('email')->unique();
            $t->timestampTz('email_verified_at')->nullable();
            $t->string('password');
            $t->string('role')->default('user');
            $t->boolean('is_active')->default(true);
            $t->rememberToken();
            $t->timestampsTz();
            $t->index(['company_id', 'role']);
        });
        Schema::create('password_reset_tokens', function (Blueprint $t) {
            $t->string('email')->primary();
            $t->string('token');
            $t->timestamp('created_at')->nullable();
        });
        Schema::create('sessions', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->foreignUlid('user_id')->nullable()->index();
            $t->string('ip_address', 45)->nullable();
            $t->text('user_agent')->nullable();
            $t->longText('payload');
            $t->integer('last_activity')->index();
        });
        Schema::create('cache', function (Blueprint $t) {
            $t->string('key')->primary();
            $t->mediumText('value');
            $t->integer('expiration');
        });
        Schema::create('cache_locks', function (Blueprint $t) {
            $t->string('key')->primary();
            $t->string('owner');
            $t->integer('expiration');
        });
        Schema::create('jobs', function (Blueprint $t) {
            $t->id();
            $t->string('queue')->index();
            $t->longText('payload');
            $t->unsignedTinyInteger('attempts');
            $t->unsignedInteger('reserved_at')->nullable();
            $t->unsignedInteger('available_at');
            $t->unsignedInteger('created_at');
        });
        Schema::create('job_batches', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->string('name');
            $t->integer('total_jobs');
            $t->integer('pending_jobs');
            $t->integer('failed_jobs');
            $t->longText('failed_job_ids');
            $t->mediumText('options')->nullable();
            $t->integer('cancelled_at')->nullable();
            $t->integer('created_at');
            $t->integer('finished_at')->nullable();
        });
        Schema::create('failed_jobs', function (Blueprint $t) {
            $t->id();
            $t->string('uuid')->unique();
            $t->text('connection');
            $t->text('queue');
            $t->longText('payload');
            $t->longText('exception');
            $t->timestamp('failed_at')->useCurrent();
        });
        Schema::create('personal_access_tokens', function (Blueprint $t) {
            $t->id();
            $t->ulidMorphs('tokenable');
            $t->text('name');
            $t->string('token', 64)->unique();
            $t->text('abilities')->nullable();
            $t->timestamp('last_used_at')->nullable();
            $t->timestamp('expires_at')->nullable()->index();
            $t->timestamps();
        });
        Schema::create('departments', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('code');
            $t->string('name');
            $t->timestampsTz();
            $t->unique(['company_id', 'code']);
        });
        Schema::create('customers', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('code');
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->string('status')->default('active');
            $t->timestampsTz();
            $t->unique(['company_id', 'code']);
            $t->index(['company_id', 'name']);
        });
        Schema::create('contacts', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('customer_id')->constrained();
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->string('position')->nullable();
            $t->timestampsTz();
        });
        Schema::create('leads', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('owner_id')->nullable()->constrained('users');
            $t->foreignUlid('customer_id')->nullable()->constrained();
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('source')->nullable();
            $t->string('status')->default('new');
            $t->unsignedTinyInteger('score')->default(0);
            $t->timestampsTz();
        });
        Schema::create('opportunities', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->foreignUlid('customer_id')->constrained();
            $t->foreignUlid('lead_id')->nullable()->constrained();
            $t->foreignUlid('owner_id')->nullable()->constrained('users');
            $t->string('name');
            $t->string('stage')->default('qualification');
            $t->decimal('amount', 20, 2)->default(0);
            $t->unsignedTinyInteger('probability')->default(0);
            $t->date('expected_close')->nullable();
            $t->timestampsTz();
        });
        Schema::create('vendors', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('code');
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('status')->default('active');
            $t->timestampsTz();
            $t->unique(['company_id', 'code']);
        });
        Schema::create('products', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('sku');
            $t->string('name');
            $t->string('unit')->default('pcs');
            $t->decimal('standard_price', 20, 2)->default(0);
            $t->decimal('standard_cost', 20, 2)->default(0);
            $t->timestampsTz();
            $t->unique(['company_id', 'sku']);
        });
        Schema::create('warehouses', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained();
            $t->string('code');
            $t->string('name');
            $t->timestampsTz();
            $t->unique(['company_id', 'code']);
        });
    }

    public function down(): void
    {
        foreach (['warehouses', 'products', 'vendors', 'opportunities', 'leads', 'contacts', 'customers', 'departments', 'personal_access_tokens', 'failed_jobs', 'job_batches', 'jobs', 'cache_locks', 'cache', 'sessions', 'password_reset_tokens', 'users', 'companies'] as $name) {
            Schema::dropIfExists($name);
        }
    }
};
