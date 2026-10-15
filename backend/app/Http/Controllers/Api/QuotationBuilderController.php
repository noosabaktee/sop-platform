<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Server-authoritative quotation form; never trusts browser total or discount amounts. */
class QuotationBuilderController extends Controller {
    public function options(Request $request) {
        $co=$request->user()->company_id;
        return response()->json(['data'=>[
            'customers'=>DB::table('customers')->where('company_id',$co)->where('status','active')->orderBy('name')->get(['id','name','code']),
            'owners'=>DB::table('users')->where('company_id',$co)->where('is_active',true)->orderBy('name')->get(['id','name']),
            'products'=>DB::table('products')->where('company_id',$co)->where('is_active',true)->orderBy('name')->get(['id','name','sku','standard_price']),
        ]]);
    }
    private function cents(string $number): int {
        if(!preg_match('/^\d{1,12}(?:\.\d{1,2})?$/',$number))
            throw ValidationException::withMessages(['price'=>'Harga harus berupa bilangan nonnegatif (maksimal dua angka desimal).']);
        [$whole,$decimal]=array_pad(explode('.',$number,2),2,'');
        return ((int)$whole)*100 + (int)str_pad($decimal,2,'0');
    }
    private function money(int $cents): string {return sprintf('%d.%02d',intdiv($cents,100),$cents%100);}
    public function list(Request $request) {
        $co=$request->user()->company_id;
        $rows=DB::table('quotations as q')->join('customers as c','c.id','=','q.customer_id')
            ->join('users as u','u.id','=','q.owner_id')->where('q.company_id',$co)
            ->orderByDesc('q.created_at')->limit(500)
            ->get(['q.id','q.number','q.status','q.currency','q.total','q.valid_until','q.version',
                'c.name as customer','u.name as owner']);
        return response()->json(['data'=>$rows]);
    }
    public function save(Request $request) {
        abort_unless(in_array($request->user()->role,['super_admin','admin','manager','sales'],true),403,
            'Role ini tidak diizinkan membuat atau mengubah quotation.');
        $data=$request->validate([
            'id'=>['nullable','ulid'],
            'customer_id'=>['required','ulid',Rule::exists('customers','id')->where('company_id',$request->user()->company_id)],
            'owner_id'=>['nullable','ulid',Rule::exists('users','id')->where('company_id',$request->user()->company_id)],
            'contact_name'=>['nullable','string','max:255'],
            'payment_terms'=>['nullable','string','max:100'],
            'currency'=>['required',Rule::in(['IDR','USD'])],
            'valid_until'=>['required','date'],
            'tax_percent'=>['required','integer','between:0,100'],
            'discount_percent'=>['required','integer','between:0,100'],
            'items'=>['required','array','min:1','max:200'],
            'items.*.description'=>['required','string','max:255'],
            'items.*.product_id'=>['nullable','ulid',Rule::exists('products','id')->where('company_id',$request->user()->company_id)],
            'items.*.quantity'=>['required','integer','min:1','max:10000'],
            'items.*.unit_price'=>['required','numeric','min:0','max:10000000000','decimal:0,2'],
        ]);
        $co=$request->user()->company_id;
        // Totals calculated exactly in integer cents; no float tax/discount drift.
        $items=[];$subtotal=0;
        foreach($data['items'] as $line){
            $unit=$this->cents((string)$line['unit_price']);
            $lineTotal=$unit*(int)$line['quantity'];
            if($lineTotal>9000000000000000 || $subtotal+$lineTotal>9000000000000000)
                throw ValidationException::withMessages(['items'=>'Nilai quotation terlalu besar.']);
            $subtotal+=$lineTotal;
            $items[]=['product_id'=>$line['product_id']??null,'description'=>$line['description'],'quantity'=>$line['quantity'],
                'unit_price'=>$this->money($unit),'line_total'=>$this->money($lineTotal),'discount'=>'0.00'];
        }
        if($subtotal===0)throw ValidationException::withMessages(['items'=>'Total quotation harus lebih dari nol.']);
        $discount=intdiv($subtotal*(int)$data['discount_percent'],100);
        $tax=intdiv(($subtotal-$discount)*(int)$data['tax_percent'],100);
        $total=$subtotal-$discount+$tax;
        return DB::transaction(function() use ($request,$data,$co,$items,$subtotal,$discount,$tax,$total) {
            $id=$data['id']??(string)Str::ulid();
            $previous=null;
            if(!empty($data['id'])){
                $previous=DB::table('quotations')->where('company_id',$co)->where('id',$id)->lockForUpdate()->first();
                abort_unless($previous,404);
                abort_unless(in_array($previous->status,['draft','rejected','revision_requested'],true),409,'Quotation yang telah disubmit tidak boleh diedit langsung.');
            }
            $values=['customer_id'=>$data['customer_id'],'owner_id'=>$data['owner_id']??$request->user()->id,
                'contact_name'=>$data['contact_name']??null,'payment_terms'=>$data['payment_terms']??null,
                'currency'=>$data['currency'],'valid_until'=>$data['valid_until'],
                'subtotal'=>$this->money($subtotal),'discount_total'=>$this->money($discount),
                'tax'=>$this->money($tax),'total'=>$this->money($total),'updated_at'=>now()];
            if($previous){
                DB::table('quotations')->where('id',$id)->update($values+['status'=>'draft','version'=>$previous->version+1]);
                DB::table('quotation_items')->where('quotation_id',$id)->delete();
            }else{
                DB::table('quotations')->insert(['id'=>$id,'company_id'=>$co,'number'=>'Q-'.now()->format('Y').'-'.strtoupper((string)Str::ulid()),
                    'status'=>'draft','version'=>1,'created_at'=>now()]+$values);
            }
            $now=now();
            DB::table('quotation_items')->insert(array_map(fn($it)=>$it+['id'=>(string)Str::ulid(),
                'quotation_id'=>$id,'created_at'=>$now,'updated_at'=>$now],$items));
            AuditService::record($request->user(),$previous?'quotation.draft.updated':'quotation.draft.created',
                'quotation',$id,$previous?['total'=>$previous->total,'status'=>$previous->status]:null,
                ['total'=>$this->money($total),'item_count'=>count($items)]);
            return response()->json(['data'=>DB::table('quotations')->where('id',$id)->first()],$previous?200:201);
        });
    }
}
