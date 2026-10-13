<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class QuotationBuilderTest extends TestCase {
    use RefreshDatabase;
    private function actor():array {
        $company=Company::factory()->create();
        $user=User::factory()->create(['company_id'=>$company->id,'role'=>'sales']);
        $customer=Customer::create(['company_id'=>$company->id,'code'=>'CST-QA','name'=>'PT QA Test','status'=>'active']);
        $this->actingAs($user);
        return [$user,$customer];
    }
    private function draft(Customer $customer,User $user):array {
        return ['customer_id'=>$customer->id,'owner_id'=>$user->id,'contact_name'=>'Andi',
            'payment_terms'=>'NET 30','currency'=>'IDR','valid_until'=>today()->addDays(30)->toDateString(),
            'tax_percent'=>11,'discount_percent'=>5,
            'items'=>[['description'=>'ERP License','quantity'=>2,'unit_price'=>'180000000.00'],
                      ['description'=>'Implementation Service','quantity'=>1,'unit_price'=>'95000000.00']]];
    }
    public function test_draft_is_persisted_with_items_and_server_computed_totals():void {
        [$user,$customer]=$this->actor();
        $data=$this->draft($customer,$user);
        $data['total']='0.00'; // Client amount is ignored even when maliciously submitted.
        $result=$this->postJson('/api/v1/quotation-builder/draft',$data)->assertCreated()->json('data');
        $this->assertSame('455000000.00',(string)$result['subtotal']);
        $this->assertSame('22750000.00',(string)$result['discount_total']);
        $this->assertSame('47547500.00',(string)$result['tax']);
        $this->assertSame('479797500.00',(string)$result['total']);
        $this->assertSame(2,DB::table('quotation_items')->where('quotation_id',$result['id'])->count());
        $this->getJson('/api/v1/quotation-builder/list')->assertOk()->assertJsonPath('data.0.number',$result['number']);
        $data['id']=$result['id'];$data['items'][0]['quantity']=3;
        $this->postJson('/api/v1/quotation-builder/draft',$data)->assertOk();
        $this->assertSame(2,DB::table('quotation_items')->where('quotation_id',$result['id'])->count());
        $this->assertDatabaseHas('quotations',['id'=>$result['id'],'version'=>2]);
    }
    public function test_submit_transitions_real_draft_and_blocks_further_direct_edits():void {
        [$user,$customer]=$this->actor();
        $data=$this->draft($customer,$user);
        $draft=$this->postJson('/api/v1/quotation-builder/draft',$data)->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/quotations/'.$draft['id'].'/submit')->assertOk()
            ->assertJsonPath('data.status','pending_approval');
        $data['id']=$draft['id'];
        $this->postJson('/api/v1/quotation-builder/draft',$data)->assertStatus(409);
        $this->assertDatabaseHas('transaction_approvals',['subject_id'=>$draft['id'],'status'=>'pending']);
    }
    public function test_customer_of_other_company_is_rejected():void {
        [$user,$customer]=$this->actor();
        $other=Company::factory()->create();
        $foreign=Customer::create(['company_id'=>$other->id,'code'=>'OTHER','name'=>'Other Company']);
        $data=$this->draft($customer,$user);$data['customer_id']=$foreign->id;
        $this->postJson('/api/v1/quotation-builder/draft',$data)->assertUnprocessable();
        $this->assertDatabaseCount('quotations',0);
    }
    public function test_manager_requests_revision_and_sales_can_update_and_resubmit():void {
        [$sales,$customer]=$this->actor();
        $payload=$this->draft($customer,$sales);
        $quote=$this->postJson('/api/v1/quotation-builder/draft',$payload)->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/submit')->assertOk();
        $manager=User::factory()->create(['company_id'=>$sales->company_id,'role'=>'manager']);
        $this->actingAs($manager);
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/decision',[
            'decision'=>'revision_requested','comment'=>'Mohon periksa kembali harga'
        ])->assertOk()->assertJsonPath('data.status','revision_requested');
        $this->assertDatabaseHas('transaction_approvals',[
            'subject_id'=>$quote['id'],'status'=>'revision_requested','comment'=>'Mohon periksa kembali harga'
        ]);
        $this->actingAs($sales);
        $payload['id']=$quote['id'];$payload['items'][0]['quantity']=3;
        $this->postJson('/api/v1/quotation-builder/draft',$payload)->assertOk();
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/submit')->assertOk();
        $this->assertDatabaseHas('quotations',['id'=>$quote['id'],'status'=>'pending_approval']);
        $this->assertSame(2,DB::table('transaction_approvals')->where('subject_id',$quote['id'])->count());
    }
    public function test_rejection_or_revision_requires_a_reason():void {
        [$sales,$customer]=$this->actor();
        $quote=$this->postJson('/api/v1/quotation-builder/draft',$this->draft($customer,$sales))->assertCreated()->json('data');
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/submit')->assertOk();
        $manager=User::factory()->create(['company_id'=>$sales->company_id,'role'=>'manager']);
        $this->actingAs($manager);
        $this->postJson('/api/v1/workflows/quotations/'.$quote['id'].'/decision',[
            'decision'=>'rejected'
        ])->assertStatus(422);
        $this->assertDatabaseHas('quotations',['id'=>$quote['id'],'status'=>'pending_approval']);
    }
}
