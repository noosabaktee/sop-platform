<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** User-scoped operational workspace sourced exclusively from normalized records. */
class WorkspaceController extends Controller {
 public function index(Request $r) {
  $user=$r->user();$company=$user->company_id;
  $tasks=DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')
   ->where('p.company_id',$company)->where('t.assignee_id',$user->id)
   ->orderByRaw('t.due_at ASC NULLS LAST')->limit(100)
   ->get(['t.id','t.title','t.status','t.progress','t.due_at','p.name as project','p.code as project_code']);
  $projects=DB::table('projects as p')->leftJoin('customers as c','c.id','=','p.customer_id')
   ->where('p.company_id',$company)->where('p.manager_id',$user->id)->orderByRaw('p.due_at ASC NULLS LAST')->limit(100)
   ->get(['p.id','p.code','p.name','p.status','p.due_at','p.budget','c.name as customer',
    DB::raw("COALESCE((SELECT ROUND(AVG(progress)) FROM project_tasks WHERE project_id=p.id),0) as progress")]);
  $approvals=DB::table('transaction_approvals as a')->leftJoin('quotations as q',function($join){
    $join->on('q.id','=','a.subject_id')->where('a.subject_type','=','quotation');
   })->leftJoin('users as u','u.id','=','a.requester_id')
   ->where('a.company_id',$company)->where('a.status','pending')
   ->when(!$user->canManageRecords(),fn($query)=>$query->where('a.requester_id',$user->id))
   ->orderBy('a.created_at')->limit(100)
   ->get(['a.id','a.subject_type','a.subject_id','a.created_at','a.status','q.number','q.total','u.name as requester']);
  $notifications=DB::table('notifications')->where('notifiable_type','App\\Models\\User')
   ->where('notifiable_id',$user->id)->orderByDesc('created_at')->limit(50)
   ->get(['id','type','data','read_at','created_at'])->map(fn($n)=>['id'=>$n->id,'type'=>$n->type,
    'data'=>json_decode($n->data,true)?:[],'read_at'=>$n->read_at,'created_at'=>$n->created_at]);
  $activities=DB::table('audit_events')->where('company_id',$company)->where('actor_id',$user->id)
   ->orderByDesc('created_at')->limit(100)->get(['id','action','entity_type','entity_id','created_at']);
  $deadlines=DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')
   ->where('p.company_id',$company)->where('t.assignee_id',$user->id)->whereNotNull('t.due_at')
   ->whereNotIn('t.status',['done','completed'])->select('t.id','t.title',DB::raw("'Task' as kind"),'t.due_at as starts_at','p.name as context','t.status')
   ->limit(100)->get();
  $meetings=DB::table('corporate_meetings')->where('company_id',$company)->where('created_by',$user->id)
   ->select('id','title',DB::raw("'Meeting' as kind"),'starts_at','location as context','status')->limit(100)->get();
  $calendar=$deadlines->concat($meetings)->sortBy('starts_at')->values();
  $documents=DB::table('documents')->where('company_id',$company)->where('owner_id',$user->id)
   ->orderByDesc('updated_at')->limit(100)->get(['id','title','category','folder','mime_type','version','status','updated_at']);
  $emails=DB::table('outbound_messages')->where('company_id',$company)->where('requested_by',$user->id)
   ->where('channel','email')->orderByDesc('created_at')->limit(100)
   ->get(['id','subject','recipient','status','sent_at','created_at']);
  $companyRow=DB::table('companies')->where('id',$company)->first(['name','currency']);
  $profile=[
   ['field'=>'Nama lengkap','value'=>$user->name,'visibility'=>'Internal'],
   ['field'=>'Email','value'=>$user->email,'visibility'=>'Internal'],
   ['field'=>'Company','value'=>$companyRow?->name,'visibility'=>'Internal'],
   ['field'=>'Role','value'=>$user->role,'visibility'=>'Restricted'],
   ['field'=>'Mata uang','value'=>$companyRow?->currency,'visibility'=>'Internal'],
   ['field'=>'Zona waktu','value'=>config('app.timezone'),'visibility'=>'Personal'],
   ['field'=>'Two-factor auth','value'=>$user->two_factor_confirmed_at?'Aktif (Authenticator)':'Belum aktif','visibility'=>'Restricted'],
  ];
  return response()->json(['data'=>compact('tasks','projects','approvals','activities','calendar','documents','notifications','emails','profile')+
   ['summary'=>['open_tasks'=>$tasks->whereNotIn('status',['done','completed'])->count(),'managed_projects'=>$projects->count(),
    'pending_approvals'=>$approvals->count(),'unread_notifications'=>$notifications->whereNull('read_at')->count()],
    'generated_at'=>now()->toIso8601String()]]);
 }
 public function markRead(Request $r,string $id) {
  $count=DB::table('notifications')->where('id',$id)->where('notifiable_type','App\\Models\\User')
   ->where('notifiable_id',$r->user()->id)->whereNull('read_at')->update(['read_at'=>now(),'updated_at'=>now()]);
  if(!$count)abort_unless(DB::table('notifications')->where('id',$id)->where('notifiable_type','App\\Models\\User')
   ->where('notifiable_id',$r->user()->id)->exists(),404);
  return response()->noContent();
 }
}
