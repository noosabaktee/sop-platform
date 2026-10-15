<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_tenders', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $t->string('code', 50);
            $t->string('name', 255);
            $t->string('client', 255);
            $t->decimal('value', 20, 2)->default(0);
            $t->date('deadline')->nullable();
            $t->string('bid', 50)->default('Pending');
            $t->string('status', 50)->default('Open');
            $t->foreignUlid('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestampsTz();

            $t->unique(['company_id', 'code']);
        });

        Schema::create('crm_proposals', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('company_id')->constrained()->cascadeOnDelete();
            $t->foreignUlid('tender_id')->nullable()->constrained('crm_tenders')->nullOnDelete();
            $t->foreignUlid('opportunity_id')->nullable()->constrained('opportunities')->nullOnDelete();
            $t->foreignUlid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $t->foreignUlid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $t->string('code', 50);
            $t->string('name', 255);
            $t->string('client', 255);
            $t->string('template', 100)->default('ERP Proposal');
            $t->string('version', 20)->default('v1');
            $t->foreignUlid('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('status', 50)->default('Draft');
            $t->decimal('value', 20, 2)->default(0);
            $t->timestampsTz();

            $t->unique(['company_id', 'code']);
        });

        Schema::table('projects', function (Blueprint $t) {
            $t->foreignUlid('tender_id')->nullable()->constrained('crm_tenders')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $t) {
            $t->dropForeign(['tender_id']);
            $t->dropColumn('tender_id');
        });
        Schema::dropIfExists('crm_proposals');
        Schema::dropIfExists('crm_tenders');
    }
};
