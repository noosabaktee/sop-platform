<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Tenant-scoped operational aggregates used by Overview and every dashboard tab. */
class DashboardController extends Controller {
 public function index(Request $request) {
  $validated=$request->validate(['period'=>['sometimes',Rule::in(['week','month','quarter','year'])]]);
  $period=$validated['period']??'month';$now=CarbonImmutable::now();
  $start=match($period){'week'=>$now->startOfWeek(),'quarter'=>$now->startOfQuarter(),'year'=>$now->startOfYear(),default=>$now->startOfMonth()};
  $company=$request->user()->company_id;$user=$request->user()->id;
  $invoice=DB::table('invoices')->where('company_id',$company)->where('created_at','>=',$start);
  $salesRevenue=(float)(clone $invoice)->whereIn('status',['posted','paid','partial'])->sum('amount');
  $outstanding=(float)DB::table('invoices')->where('company_id',$company)
   ->whereIn('status',['posted','partial'])->sum(DB::raw('amount - paid_amount'));
  $activeProjects=DB::table('projects')->where('company_id',$company)->whereNotIn('status',['done','completed','cancelled'])->count();
  $openTasks=DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')
   ->where('p.company_id',$company)->whereNotIn('t.status',['done','completed'])->count();
  $pendingApprovals=DB::table('transaction_approvals')->where('company_id',$company)->where('status','pending')->count();
  $series=DB::table('invoices')->where('company_id',$company)->where('created_at','>=',$start)
   ->selectRaw("to_char(created_at, 'YYYY-MM') as bucket, COALESCE(SUM(amount),0) as invoiced, COALESCE(SUM(paid_amount),0) as collected")
   ->groupByRaw("to_char(created_at, 'YYYY-MM')")->orderBy('bucket')->get()
   ->map(fn($row)=>['period'=>$row->bucket,'invoiced'=>(float)$row->invoiced,'collected'=>(float)$row->collected]);
  $statusCounts=fn(string $table)=>DB::table($table)->where('company_id',$company)->select('status',DB::raw('COUNT(*) as total'))
   ->groupBy('status')->pluck('total','status')->map(fn($n)=>(int)$n);
  $dailyRows=DB::table('invoices')->where('company_id',$company)->where('created_at','>=',$now->subDays(6)->startOfDay())
   ->selectRaw('created_at::date as day, COALESCE(SUM(amount),0) as total')->groupByRaw('created_at::date')->pluck('total','day');
  $daily=collect(range(6,0))->map(function($days)use($now,$dailyRows){$date=$now->subDays($days);
   return ['date'=>$date->toDateString(),'label'=>$date->isoFormat('ddd'),'value'=>(float)($dailyRows[$date->toDateString()]??0)];});
  $workItems=DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')->leftJoin('users as u','u.id','=','t.assignee_id')
   ->where('p.company_id',$company)->where('t.assignee_id',$user)->whereNotIn('t.status',['done','completed'])
   ->orderByRaw('t.due_at ASC NULLS LAST')->limit(5)->get(['t.id','t.title as description','t.status','t.progress','t.due_at as deadline',
    'p.code as record','p.name as context','u.name as owner'])->map(fn($row)=>[...((array)$row),'priority'=>($row->deadline&&$row->deadline<now()->toDateString())?'High':'Medium','module'=>'Projects']);
  $activityQuery=DB::table('audit_events as a')->leftJoin('users as u','u.id','=','a.actor_id')->where('a.company_id',$company);
  if(!$request->user()->canManageRecords())$activityQuery->where('a.actor_id',$user);
  $activities=$activityQuery->orderByDesc('a.created_at')->limit(30)
   ->get(['a.id','a.action','a.entity_type','a.entity_id','a.created_at','u.name as actor']);

  return response()->json(['data'=>[
   'period'=>$period,'period_start'=>$start->toDateString(),
   'company'=>DB::table('companies')->where('id',$company)->value('name'),
   'customers'=>DB::table('customers')->where('company_id',$company)->count(),
   'opportunities'=>DB::table('opportunities')->where('company_id',$company)->whereNotIn('stage',['lost','closed'])->count(),
   'opportunity_value'=>(float)DB::table('opportunities')->where('company_id',$company)->whereNotIn('stage',['lost','closed'])->sum('amount'),
   'open_project_tasks'=>$openTasks,'quotations'=>DB::table('quotations')->where('company_id',$company)->count(),
   'projects'=>$activeProjects,'sales_revenue'=>$salesRevenue,'outstanding_ar'=>$outstanding,
   'pending_approvals'=>$pendingApprovals,
   'sales'=>['quotation_status'=>$statusCounts('quotations'),'invoice_status'=>$statusCounts('invoices'),'monthly'=>$series],
   'projects_summary'=>['status'=>$statusCounts('projects'),'open_tasks'=>$openTasks,
    'overdue_tasks'=>DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')->where('p.company_id',$company)
     ->whereNotIn('t.status',['done','completed'])->whereDate('t.due_at','<',DB::raw('CURRENT_DATE'))->count()],
   'procurement'=>['request_status'=>$statusCounts('purchase_requests'),'order_status'=>$statusCounts('purchase_orders')],
   'inventory'=>['products'=>DB::table('products')->where('company_id',$company)->count(),
    'warehouses'=>DB::table('warehouses')->where('company_id',$company)->count(),
    'stock_value'=>(float)DB::table('inventory_movements')->where('company_id',$company)->sum(DB::raw('quantity * unit_cost'))],
   'personal'=>['assigned_open_tasks'=>DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')
    ->where('p.company_id',$company)->where('t.assignee_id',$user)->whereNotIn('t.status',['done','completed'])->count(),
    'managed_projects'=>DB::table('projects')->where('company_id',$company)->where('manager_id',$user)->count(),
    'unread_notifications'=>DB::table('notifications')->where('notifiable_type','App\\Models\\User')
     ->where('notifiable_id',$user)->whereNull('read_at')->count()],
   'overview'=>['deadlines_this_week'=>DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')
     ->where('p.company_id',$company)->where('t.assignee_id',$user)->whereNotIn('t.status',['done','completed'])
     ->whereBetween('t.due_at',[DB::raw('CURRENT_DATE'),DB::raw("CURRENT_DATE + INTERVAL '7 days'")])->count(),
    'daily_sales'=>$daily,'activities'=>$activities,'work_items'=>$workItems],
   'last_refreshed_at'=>now()->toIso8601String()
  ]]);
 }
}
