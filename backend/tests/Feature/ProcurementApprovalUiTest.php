<?php
namespace Tests\Feature;
use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class ProcurementApprovalUiTest extends TestCase {
 use RefreshDatabase;
 public function test_purchase_approval_appears_in_same_workflow_queue_as_quotation():void {
  $this->seed(DatabaseSeeder::class);
  $co=Company::where('code','SOP-DEMO')->firstOrFail();
  $sales=User::where('email','rina@sop.local')->firstOrFail();
  $manager=User::where('email','admin@sop.local')->firstOrFail();
  $product=DB::table('products')->where('company_id',$co->id)->firstOrFail();
  $this->actingAs($sales);
  $pr=$this->postJson('/api/v1/workflows/purchase-requests',['lines'=>[
   ['product_id'=>$product->id,'quantity'=>'2.0000','unit_price'=>'175.00']
  ]])->assertCreated()->json('data');
  $this->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/submit')->assertOk();
  $this->getJson('/api/v1/workflows/transaction-approvals')->assertOk()
   ->assertJsonFragment(['subject_type'=>'purchase_request','subject_id'=>$pr['id'],'number'=>$pr['number']]);
  $this->actingAs($manager)->getJson('/api/v1/workflows/transaction-approvals')->assertOk()
   ->assertJsonFragment(['subject_type'=>'purchase_request','subject_id'=>$pr['id'],'number'=>$pr['number']]);
  $this->postJson('/api/v1/workflows/purchase-requests/'.$pr['id'].'/decision',
   ['decision'=>'approved'])->assertOk();
  $this->assertSame('approved',(string)DB::table('purchase_requests')->where('id',$pr['id'])->value('status'));
 }
}
