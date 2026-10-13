<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** User-scoped operational workspace sourced from normalized PostgreSQL records. */
class WorkspaceController extends Controller{
 public function index(Request $r){
  $user=$r->user();$company=$user->company_id;
  $tasks=DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')
   ->where('p.company_id',$company)->where('t.assignee_id',$user->id)
   ->orderByRaw('t.due_at ASC NULLS LAST')->limit(100)
   ->get(['t.id','t.title','t.status','t.progress','t.due_at','p.name as project','p.code as project_code']);
  $projects=DB::table('projects as p')->leftJoin('customers as c','c.id','=','p.customer_id')
   ->where('p.company_id',$company)->where('p.manager_id',$user->id)->orderBy('p.due_at')->limit(100)
   ->get(['p.id','p.code','p.name','p.status','p.due_at','p.budget','c.name as customer']);
  $approvals=DB::table('transaction_approvals as a')->leftJoin('quotations as q',function($join){
    $join->on('q.id','=','a.subject_id')->where('a.subject_type','=','quotation');
   })->leftJoin('users as u','u.id','=','a.requester_id')
   ->where('a.company_id',$company)->where('a.status','pending')
   ->when(!$user->canManageRecords(),fn($query)=>$query->where('a.requester_id',$user->id))
   ->orderBy('a.created_at')->limit(100)
   ->get(['a.id','a.subject_type','a.subject_id','a.created_at','a.status','q.number','q.total','u.name as requester']);
  $notifications=DB::table('notifications')->where('notifiable_type','App\\Models\\User')
   ->where('notifiable_id',$user->id)->orderByDesc('created_at')->limit(30)
   ->get(['id','type','data','read_at','created_at'])->map(fn($n)=>['id'=>$n->id,'type'=>$n->type,
    'data'=>json_decode($n->data,true),'read_at'=>$n->read_at,'created_at'=>$n->created_at]);
  return response()->json(['data'=>['tasks'=>$tasks,'projects'=>$projects,'approvals'=>$approvals,
    'notifications'=>$notifications,'generated_at'=>now()->toIso8601String()]]);
 }
 public function markRead(Request $r,string $id){
  $count=DB::table('notifications')->where('id',$id)->where('notifiable_type','App\\Models\\User')
   ->where('notifiable_id',$r->user()->id)->update(['read_at'=>now(),'updated_at'=>now()]);
  abort_unless($count,404);return response()->noContent();
 }
}
