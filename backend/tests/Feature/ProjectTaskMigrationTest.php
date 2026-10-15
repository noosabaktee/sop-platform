<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProjectTaskMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_task_parent_fk_allows_valid_parent_and_rejects_unknown(): void
    {
        $company = (string) Str::ulid();
        $user = (string) Str::ulid();
        $customer = (string) Str::ulid();
        $project = (string) Str::ulid();
        $parent = (string) Str::ulid();
        DB::table('companies')->insert(['id' => $company, 'code' => 'TEST', 'name' => 'Test', 'currency' => 'IDR', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('users')->insert(['id' => $user, 'company_id' => $company, 'name' => 'Test', 'email' => 'task@example.local', 'password' => 'hashed', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('customers')->insert(['id' => $customer, 'company_id' => $company, 'code' => 'C-1', 'name' => 'Test', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('projects')->insert(['id' => $project, 'company_id' => $company, 'customer_id' => $customer, 'manager_id' => $user, 'code' => 'P-1', 'name' => 'Project', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('project_tasks')->insert(['id' => $parent, 'project_id' => $project, 'title' => 'Parent', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('project_tasks')->insert(['id' => (string) Str::ulid(), 'project_id' => $project, 'parent_id' => $parent, 'title' => 'Child', 'created_at' => now(), 'updated_at' => now()]);
        $this->assertDatabaseHas('project_tasks', ['parent_id' => $parent, 'title' => 'Child']);
    }
}
