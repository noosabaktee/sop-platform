<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ExactDecimal as D;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
class ProjectCostController extends Controller {
 public function index(Request $r){$co=$r->user()->company_id;
  $projects=DB::table('projects as p')->leftJoin('project_costs as c','c.project_id','=','p.id')->where('p.company_id',$co)
   ->groupBy('p.id','p.code','p.name','p.budget','p.contract_value')
   ->select('p.id','p.code','p.name','p.budget','p.contract_value')->selectRaw('COALESCE(SUM(c.amount),0) as actual_cost')->orderBy('p.code')->get();
  // Revenue is recognized by posted invoices for the project customer only when explicitly linked elsewhere.
  // This view deliberately presents contract-value forecast, not booked revenue.
  $costs=DB::table('project_costs as c')->join('projects as p','p.id','=','c.project_id')->where('c.company_id',$co)
   ->orderByDesc('c.cost_date')->limit(250)->get(['c.*','p.code as project_code']);
  return response()->json(['data'=>['projects'=>$projects,'costs'=>$costs,'basis'=>'forecast_contract_value_not_recognized_revenue']]);
 }
 public function store(Request $r){abort_unless(in_array($r->user()->role,['super_admin','admin','manager','finance'],true),403);$co=$r->user()->company_id;
  $d=$r->validate(['project_id'=>['required','ulid',Rule::exists('projects','id')->where('company_id',$co)],
   'reference'=>['required','string','max:100'],'cost_date'=>['required','date'],'category'=>['required',Rule::in(['material','labor','expense','service','other'])],
   'description'=>['required','string','max:500'],'amount'=>['required','numeric','gt:0','decimal:0,2']]);
  return DB::transaction(function()use($r,$co,$d){$existing=DB::table('project_costs')->where('company_id',$co)->where('reference',$d['reference'])->first();
   if($existing){
    abort_unless($existing->project_id===$d['project_id'] &&
     D::parse((string)$existing->amount)===D::parse((string)$d['amount']) && $existing->category===$d['category'],409,'Reference biaya sudah digunakan untuk transaksi berbeda.');
    return response()->json(['data'=>$existing,'already_exists'=>true]);
   }
   $id=(string)Str::ulid();$now=now();DB::table('project_costs')->insert($d+['id'=>$id,'company_id'=>$co,'created_by'=>$r->user()->id,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'project_cost.created','project_cost',$id);
   return response()->json(['data'=>DB::table('project_costs')->find($id)],201);
  });
 }
}
