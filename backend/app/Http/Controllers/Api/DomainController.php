<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Database\QueryException;
class DomainController extends Controller {
 private const DOMAINS=[
  'customers'=>['table'=>'customers','fields'=>['code','name','email','phone','status'],'required'=>['code','name']],
  'vendors'=>['table'=>'vendors','fields'=>['code','name','email','status'],'required'=>['code','name']],
  'products'=>['table'=>'products','fields'=>['sku','name','unit','standard_price','standard_cost'],'required'=>['sku','name']],
  'leads'=>['table'=>'leads','fields'=>['name','email','source','score','status','customer_id','owner_id'],'required'=>['name']],
  'opportunities'=>['table'=>'opportunities','fields'=>['name','customer_id','lead_id','owner_id','stage','amount','probability','expected_close'],'required'=>['name','customer_id']],
  'quotations'=>['table'=>'quotations','fields'=>['number','customer_id','owner_id','status','currency','subtotal','tax','total','valid_until'],'required'=>['number','customer_id']],
  'sales-orders'=>['table'=>'sales_orders','fields'=>['number','quotation_id','customer_id','status','total'],'required'=>['number','customer_id']],
  'invoices'=>['table'=>'invoices','fields'=>['number','customer_id','sales_order_id','amount','paid_amount','status','due_date'],'required'=>['number','customer_id']],
  'projects'=>['table'=>'projects','fields'=>['code','name','customer_id','manager_id','status','started_at','due_at','contract_value','budget'],'required'=>['code','name','customer_id']],
  'purchase-requests'=>['table'=>'purchase_requests','fields'=>['number','requester_id','project_id','status','estimated_total'],'required'=>['number']],
  'purchase-orders'=>['table'=>'purchase_orders','fields'=>['number','purchase_request_id','vendor_id','status','total'],'required'=>['number','vendor_id']],
  'inventory-movements'=>['table'=>'inventory_movements','fields'=>['product_id','warehouse_id','quantity','unit_cost','movement_type','reference','posted_at'],'required'=>['product_id','warehouse_id','quantity','movement_type']]
 ];
 /** Financially consequential records are immutable through the generic CRUD API.
  * Use the dedicated validated workflow endpoints instead. */
 private const WORKFLOW_ONLY=['quotations','sales-orders','invoices','purchase-requests','purchase-orders','inventory-movements'];
 private function authorizeWrite(Request $request,string $domain):void {
  if(in_array($domain,self::WORKFLOW_ONLY,true))abort(405,'Transaksi harus diproses melalui workflow API yang tervalidasi.');
  $role=(string)$request->user()->role;
  $permissions=[
   'customers'=>['super_admin','admin','manager','sales'],
   'vendors'=>['super_admin','admin','manager','procurement'],
   'products'=>['super_admin','admin','manager','procurement','warehouse'],
   'leads'=>['super_admin','admin','manager','sales'],
   'opportunities'=>['super_admin','admin','manager','sales'],
   'projects'=>['super_admin','admin','manager','project_manager'],
  ];
  abort_unless(in_array($role,$permissions[$domain]??[],true),403,'Role ini tidak boleh mengubah data tersebut.');
 }
 private const FK=['customer_id'=>'customers','lead_id'=>'leads','owner_id'=>'users','manager_id'=>'users','requester_id'=>'users','vendor_id'=>'vendors','product_id'=>'products','warehouse_id'=>'warehouses','project_id'=>'projects','purchase_request_id'=>'purchase_requests','quotation_id'=>'quotations','sales_order_id'=>'sales_orders'];
 private function cfg(string $domain):array {abort_unless(isset(self::DOMAINS[$domain]),404);return self::DOMAINS[$domain];}
 private function rules(string $domain,Request $request):array{
  $cfg=$this->cfg($domain);$rules=[];
  foreach($cfg['fields'] as $field){$required=in_array($field,$cfg['required'],true) && $request->isMethod('post');$rule=[$required?'required':'sometimes','nullable'];
   if(isset(self::FK[$field])){$rule[]='ulid';$rule[]=Rule::exists(self::FK[$field],'id')->where('company_id',$request->user()->company_id);}
   else if(in_array($field,['subtotal','tax','total','amount','paid_amount','budget','contract_value','estimated_total','standard_price','standard_cost','unit_cost','quantity'],true)){$rule[]='numeric';$rule[]='min:0';}
   else if(in_array($field,['score','probability'],true)){$rule[]='integer';$rule[]='between:0,100';}
   else if(in_array($field,['expected_close','valid_until','due_date','due_at','started_at','posted_at'],true)){$rule[]='date';}
   else if($field==='email'){$rule[]='email';$rule[]='max:255';}
   else {$rule[]='string';$rule[]='max:255';}
   $rules[$field]=$rule;
  }
  return $rules;
 }
 public function index(Request $request,string $domain){$cfg=$this->cfg($domain);$perPage=min(max((int)$request->input('per_page',30),1),100);$q=DB::table($cfg['table'])->where('company_id',$request->user()->company_id);if($request->filled('search')){ $col=in_array('name',$cfg['fields'],true)?'name':(in_array('number',$cfg['fields'],true)?'number':'code');$q->where($col,'ilike','%'.str_replace(['%','_'],['\\%','\\_'],$request->input('search')).'%');}return response()->json($q->orderByDesc('created_at')->paginate($perPage));}
 public function show(Request $request,string $domain,string $id){$table=$this->cfg($domain)['table'];$result=DB::table($table)->where('company_id',$request->user()->company_id)->where('id',$id)->first();abort_unless($result,404);return response()->json(['data'=>$result]);}
 public function store(Request $request,string $domain){$cfg=$this->cfg($domain);$this->authorizeWrite($request,$domain);$data=$request->validate($this->rules($domain,$request));$result=DB::transaction(function()use($request,$cfg,$data,$domain){$id=(string)Str::ulid();$insert=array_merge($data,['id'=>$id,'company_id'=>$request->user()->company_id,'created_at'=>now(),'updated_at'=>now()]);if(array_key_exists('owner_id',$this->placeholder($cfg))&&!isset($insert['owner_id']))$insert['owner_id']=$request->user()->id;if($domain==='inventory-movements'&&!isset($insert['posted_at']))$insert['posted_at']=now();if($domain==='projects'&&!isset($insert['manager_id']))$insert['manager_id']=$request->user()->id;if($domain==='purchase-requests'&&!isset($insert['requester_id']))$insert['requester_id']=$request->user()->id;DB::table($cfg['table'])->insert($insert);AuditService::record($request->user(),'created',$cfg['table'],$id,null,$insert);return DB::table($cfg['table'])->find($id);});return response()->json(['data'=>$result],201);}
 private function placeholder(array $cfg):array{return array_fill_keys($cfg['fields'],true);}
 public function update(Request $request,string $domain,string $id){$cfg=$this->cfg($domain);$this->authorizeWrite($request,$domain);$data=$request->validate($this->rules($domain,$request));return DB::transaction(function()use($request,$cfg,$domain,$id,$data){$q=DB::table($cfg['table'])->where('company_id',$request->user()->company_id)->where('id',$id);$locked=$q->lockForUpdate()->first();abort_unless($locked,404);$old=(array)$locked;if(in_array($domain,['quotations','sales-orders','invoices'],true)&&in_array($old['status']??'', ['approved','posted','paid','closed'],true))abort(409,'Final transactions require reversal or adjustment');$q->update(array_merge($data,['updated_at'=>now()]));AuditService::record($request->user(),'updated',$cfg['table'],$id,$old,$data);return response()->json(['data'=>DB::table($cfg['table'])->find($id)]);});}
 public function destroy(Request $request,string $domain,string $id){$cfg=$this->cfg($domain);$this->authorizeWrite($request,$domain);abort_unless($request->user()->canManageRecords(),403);return DB::transaction(function()use($request,$cfg,$id){$q=DB::table($cfg['table'])->where('company_id',$request->user()->company_id)->where('id',$id);$record=$q->lockForUpdate()->first();abort_unless($record,404);try{$q->delete();}catch(QueryException $e){abort(409,'Referenced records cannot be deleted');}AuditService::record($request->user(),'deleted',$cfg['table'],$id,(array)$record);return response()->noContent();});}
}
