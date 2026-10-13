<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\BusinessRecord;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
class ApprovalController extends Controller{
 public function index(Request $request){return response()->json(['data'=>Approval::where('company_id',$request->user()->company_id)->latest()->paginate(50)]);}
 public function decide(Request $request,Approval $approval){abort_unless($approval->company_id===$request->user()->company_id&&$request->user()->canManageRecords(),403);$d=$request->validate(['decision'=>['required',Rule::in(['approved','rejected'])],'comment'=>['nullable','string']]);return DB::transaction(function()use($approval,$request,$d){$a=Approval::whereKey($approval->id)->lockForUpdate()->firstOrFail();abort_unless($a->status==='pending',409);$a->update(['status'=>$d['decision'],'comment'=>$d['comment']??null,'approver_id'=>$request->user()->id,'decided_at'=>now()]);$record=BusinessRecord::findOrFail($a->business_record_id);$record->status=$a->status;$record->version++;$record->save();AuditService::record($request->user(),'approval:'.$a->status,'approval',$a->id);return response()->json(['data'=>$a]);});}
}
