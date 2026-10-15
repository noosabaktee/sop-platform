<?php
namespace Tests\Feature;
use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingPeriodTest extends TestCase {
 use RefreshDatabase;
 private function journalPayload(User $user,string $date):array{$ids=DB::table('chart_of_accounts')->where('company_id',$user->company_id)->whereIn('code',['1100','4100'])->pluck('id','code');return [
  'date'=>$date,'description'=>'Uji period close','source_id'=>(string)Str::ulid(),
  'lines'=>[['account_id'=>$ids['1100'],'debit'=>'25.00','credit'=>'0.00'],['account_id'=>$ids['4100'],'debit'=>'0.00','credit'=>'25.00']]
 ];}
 public function test_closed_period_blocks_manual_journal_and_is_tenant_scoped():void{
  $this->seed(DatabaseSeeder::class);$admin=User::where('email','admin@sop.local')->firstOrFail();$this->actingAs($admin);
  $period=$this->postJson('/api/v1/operational/accounting/periods',['starts_on'=>today()->toDateString(),'ends_on'=>today()->toDateString(),'note'=>'Tutup harian QA'])
   ->assertCreated()->json('data');
  $this->postJson('/api/v1/operational/accounting/journal',$this->journalPayload($admin,today()->toDateString()))->assertConflict();
  $this->assertDatabaseHas('audit_events',['action'=>'accounting_period.closed','entity_id'=>$period['id']]);
  $other=Company::factory()->create();$otherAdmin=User::factory()->create(['company_id'=>$other->id,'role'=>'admin']);
  foreach([['1100','Cash','asset'],['4100','Revenue','income']] as [$code,$name,$type])DB::table('chart_of_accounts')->insert(['id'=>(string)Str::ulid(),'company_id'=>$other->id,'code'=>$code,'name'=>$name,'type'=>$type,'created_at'=>now(),'updated_at'=>now()]);
  $this->actingAs($otherAdmin)->postJson('/api/v1/operational/accounting/journal',$this->journalPayload($otherAdmin,today()->toDateString()))->assertCreated();
 }
 public function test_staff_cannot_close_and_only_super_admin_can_reopen():void{
  $this->seed(DatabaseSeeder::class);$staff=User::where('email','rina@sop.local')->firstOrFail();
  $this->actingAs($staff)->postJson('/api/v1/operational/accounting/periods',['starts_on'=>today()->toDateString(),'ends_on'=>today()->toDateString()])->assertForbidden();
  $admin=User::where('email','admin@sop.local')->firstOrFail();$period=$this->actingAs($admin)->postJson('/api/v1/operational/accounting/periods',['starts_on'=>today()->toDateString(),'ends_on'=>today()->toDateString()])->assertCreated()->json('data');
  $manager=User::where('email','bagus@sop.local')->firstOrFail();$this->actingAs($manager)->postJson('/api/v1/operational/accounting/periods/'.$period['id'].'/reopen')->assertForbidden();
  $this->actingAs($admin)->postJson('/api/v1/operational/accounting/periods/'.$period['id'].'/reopen')->assertOk()->assertJsonPath('data.status','reopened');
 }
 public function test_closed_period_blocks_sales_invoice_posting_through_shared_journal_guard():void{
  $this->seed(DatabaseSeeder::class);$admin=User::where('email','admin@sop.local')->firstOrFail();$this->actingAs($admin);
  $customer=DB::table('customers')->where('company_id',$admin->company_id)->firstOrFail();$order=(string)Str::ulid();
  DB::table('sales_orders')->insert(['id'=>$order,'company_id'=>$admin->company_id,'quotation_id'=>null,'customer_id'=>$customer->id,
   'number'=>'SO-PERIOD-TEST','status'=>'confirmed','total'=>'100.00','created_at'=>now(),'updated_at'=>now()]);
  $this->postJson('/api/v1/operational/accounting/periods',['starts_on'=>today()->toDateString(),'ends_on'=>today()->toDateString()])->assertCreated();
  $this->postJson('/api/v1/workflows/sales-orders/'.$order.'/invoice')->assertConflict();
  $this->assertDatabaseMissing('invoices',['sales_order_id'=>$order]);
 }
 public function test_idempotent_manual_journal_can_be_retried_after_period_is_closed():void{
  $this->seed(DatabaseSeeder::class);$admin=User::where('email','admin@sop.local')->firstOrFail();$this->actingAs($admin);
  $payload=$this->journalPayload($admin,today()->toDateString());$this->postJson('/api/v1/operational/accounting/journal',$payload)->assertCreated();
  $this->postJson('/api/v1/operational/accounting/periods',['starts_on'=>today()->toDateString(),'ends_on'=>today()->toDateString()])->assertCreated();
  $this->postJson('/api/v1/operational/accounting/journal',$payload)->assertOk()->assertJsonPath('already_exists',true);
 }
}
