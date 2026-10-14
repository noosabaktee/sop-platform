<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class DashboardWorkspaceTest extends TestCase {
 use RefreshDatabase;

 private function project(Company $company,User $user,string $code):string {
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'C-'.$code,'name'=>'Customer '.$code]);$id=(string)Str::ulid();
  DB::table('projects')->insert(['id'=>$id,'company_id'=>$company->id,'customer_id'=>$customer->id,'manager_id'=>$user->id,
   'code'=>$code,'name'=>'Project '.$code,'status'=>'active','created_at'=>now(),'updated_at'=>now()]);return $id;
 }

 public function test_dashboard_uses_period_and_never_leaks_another_company():void {
  $company=Company::factory()->create(['name'=>'Tenant Utama']);$user=User::factory()->create(['company_id'=>$company->id]);
  $other=Company::factory()->create();$otherUser=User::factory()->create(['company_id'=>$other->id]);
  $customer=Customer::create(['company_id'=>$company->id,'code'=>'CUS-1','name'=>'Visible']);
  $hidden=Customer::create(['company_id'=>$other->id,'code'=>'CUS-X','name'=>'Hidden']);
  DB::table('invoices')->insert([
   ['id'=>(string)Str::ulid(),'company_id'=>$company->id,'customer_id'=>$customer->id,'number'=>'INV-NOW','amount'=>1000,'paid_amount'=>250,'status'=>'partial','created_at'=>now(),'updated_at'=>now()],
   ['id'=>(string)Str::ulid(),'company_id'=>$company->id,'customer_id'=>$customer->id,'number'=>'INV-OLD','amount'=>5000,'paid_amount'=>5000,'status'=>'paid','created_at'=>now()->subMonths(3),'updated_at'=>now()->subMonths(3)],
   ['id'=>(string)Str::ulid(),'company_id'=>$other->id,'customer_id'=>$hidden->id,'number'=>'INV-HIDDEN','amount'=>999999,'paid_amount'=>0,'status'=>'posted','created_at'=>now(),'updated_at'=>now()],
  ]);
  $project=$this->project($company,$user,'DASH-QA');DB::table('project_tasks')->insert(['id'=>(string)Str::ulid(),'project_id'=>$project,
   'assignee_id'=>$user->id,'title'=>'Deadline dashboard','status'=>'todo','progress'=>0,'due_at'=>today()->addDays(2),'created_at'=>now(),'updated_at'=>now()]);
  DB::table('audit_events')->insert(['id'=>(string)Str::ulid(),'company_id'=>$company->id,'actor_id'=>$user->id,'action'=>'dashboard.checked','entity_type'=>'invoice','entity_id'=>'INV-NOW','created_at'=>now()]);
  $this->actingAs($user)->getJson('/api/v1/dashboard?period=month')->assertOk()
   ->assertJsonPath('data.company','Tenant Utama')->assertJsonPath('data.customers',2)
   ->assertJsonPath('data.sales_revenue',1000)->assertJsonPath('data.outstanding_ar',750)
   ->assertJsonCount(1,'data.sales.monthly')->assertJsonCount(7,'data.overview.daily_sales')
   ->assertJsonPath('data.overview.activities.0.action','dashboard.checked')
   ->assertJsonPath('data.overview.work_items.0.description','Deadline dashboard')
   ->assertJsonPath('data.overview.deadlines_this_week',1);
  $this->actingAs($otherUser)->getJson('/api/v1/dashboard?period=month')->assertOk()->assertJsonPath('data.sales_revenue',999999);
  $this->actingAs($user)->getJson('/api/v1/dashboard?period=invalid')->assertUnprocessable();
 }

 public function test_workspace_projects_every_personal_panel_and_marks_only_own_notification_read():void {
  $company=Company::factory()->create(['name'=>'SOP QA']);$user=User::factory()->create(['company_id'=>$company->id,'role'=>'manager','two_factor_confirmed_at'=>now()]);
  $other=User::factory()->create(['company_id'=>$company->id]);$project=$this->project($company,$user,'PRJ-QA');$now=now();
  $task=(string)Str::ulid();DB::table('project_tasks')->insert(['id'=>$task,'project_id'=>$project,'assignee_id'=>$user->id,'title'=>'Task nyata','status'=>'todo','progress'=>0,'due_at'=>today()->addDay(),'created_at'=>$now,'updated_at'=>$now]);
  DB::table('audit_events')->insert(['id'=>(string)Str::ulid(),'company_id'=>$company->id,'actor_id'=>$user->id,'action'=>'qa.performed','entity_type'=>'project','entity_id'=>$project,'created_at'=>$now]);
  DB::table('corporate_meetings')->insert(['id'=>(string)Str::ulid(),'company_id'=>$company->id,'created_by'=>$user->id,'title'=>'Rapat QA','starts_at'=>$now->addDay(),'created_at'=>$now,'updated_at'=>$now]);
  DB::table('documents')->insert(['id'=>(string)Str::ulid(),'company_id'=>$company->id,'owner_id'=>$user->id,'title'=>'Dokumen QA','storage_path'=>'qa/test.pdf','version'=>1,'status'=>'draft','category'=>'project','created_at'=>$now,'updated_at'=>$now]);
  DB::table('outbound_messages')->insert(['id'=>(string)Str::ulid(),'company_id'=>$company->id,'requested_by'=>$user->id,'channel'=>'email','recipient'=>'qa@example.test','subject'=>'Email QA','content'=>'body','idempotency_key'=>'workspace-qa','status'=>'sent','created_at'=>$now,'updated_at'=>$now]);
  $mine=(string)Str::uuid();$theirs=(string)Str::uuid();
  DB::table('notifications')->insert([
   ['id'=>$mine,'type'=>'approval','notifiable_type'=>'App\\Models\\User','notifiable_id'=>$user->id,'data'=>json_encode(['message'=>'Notifikasi QA']),'created_at'=>$now,'updated_at'=>$now],
   ['id'=>$theirs,'type'=>'approval','notifiable_type'=>'App\\Models\\User','notifiable_id'=>$other->id,'data'=>'{}','created_at'=>$now,'updated_at'=>$now],
  ]);
  $this->actingAs($user)->getJson('/api/v1/workspace')->assertOk()
   ->assertJsonPath('data.tasks.0.title','Task nyata')->assertJsonPath('data.projects.0.code','PRJ-QA')
   ->assertJsonPath('data.activities.0.action','qa.performed')->assertJsonPath('data.documents.0.title','Dokumen QA')
   ->assertJsonPath('data.notifications.0.data.message','Notifikasi QA')->assertJsonPath('data.emails.0.subject','Email QA')
   ->assertJsonPath('data.profile.0.value',$user->name)->assertJsonPath('data.summary.unread_notifications',1);
  $this->actingAs($user)->postJson("/api/v1/workspace/notifications/$mine/read")->assertNoContent();
  $this->actingAs($user)->postJson("/api/v1/workspace/notifications/$mine/read")->assertNoContent();
  $this->actingAs($user)->postJson("/api/v1/workspace/notifications/$theirs/read")->assertNotFound();
  $this->assertDatabaseHas('notifications',['id'=>$theirs,'read_at'=>null]);
 }
}
