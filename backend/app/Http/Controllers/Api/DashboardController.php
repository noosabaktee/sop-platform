<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class DashboardController extends Controller{
 public function index(Request $request){$co=$request->user()->company_id;return response()->json(['data'=>['customers'=>DB::table('customers')->where('company_id',$co)->count(),
'opportunities'=>DB::table('opportunities')->where('company_id',$co)->whereNotIn('stage',['lost','closed'])->count(),
'open_project_tasks'=>DB::table('project_tasks')->join('projects','projects.id','=','project_tasks.project_id')->where('projects.company_id',$co)->whereNotIn('project_tasks.status',['done','completed'])->count(),'quotations'=>DB::table('quotations')->where('company_id',$co)->count(),'projects'=>DB::table('projects')->where('company_id',$co)->count(),'sales_revenue'=>(float)DB::table('invoices')->where('company_id',$co)->whereIn('status',['posted','paid','partial'])->sum('amount'),'outstanding_ar'=>(float)DB::table('invoices')->where('company_id',$co)->whereIn('status',['posted','partial'])->sum(DB::raw('amount - paid_amount')),'pending_approvals'=>DB::table('approvals')->where('company_id',$co)->where('status','pending')->count(),'last_refreshed_at'=>now()->toIso8601String()]]);}
}
