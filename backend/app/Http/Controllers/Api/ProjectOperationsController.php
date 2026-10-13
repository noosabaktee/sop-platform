<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Authoritative project task CRUD; client grids are projections, not source of truth. */
class ProjectOperationsController extends Controller {
 private function project(Request $r,string $id,bool $lock=false):object {
  $q=DB::table('projects')->where('company_id',$r->user()->company_id)->where('id',$id);
  $row=($lock?$q->lockForUpdate():$q)->first();abort_unless($row,404);return $row;
 }
 private function task(Request $r,string $id,bool $lock=false):object {
  $q=DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')
   ->where('p.company_id',$r->user()->company_id)->where('t.id',$id)->select('t.*','p.manager_id','p.company_id');
  $row=($lock?$q->lockForUpdate():$q)->first();abort_unless($row,404);return $row;
 }
 private function canEdit(Request $r,object $project):void{
  abort_unless($r->user()->canManageRecords() || $r->user()->id===$project->manager_id,403);
 }
 public function index(Request $r){$co=$r->user()->company_id;
  return response()->json(['data'=>[
   'projects'=>DB::table('projects as p')
    ->join('customers as c','c.id','=','p.customer_id')
    ->join('users as u','u.id','=','p.manager_id')
    ->where('p.company_id',$co)->orderByDesc('p.created_at')->limit(200)
    ->get(['p.*','c.name as customer','u.name as manager']),
   'tasks'=>DB::table('project_tasks as t')->join('projects as p','p.id','=','t.project_id')
    ->leftJoin('users as u','u.id','=','t.assignee_id')
    ->leftJoin('project_tasks as parent','parent.id','=','t.parent_id')
    ->where('p.company_id',$co)->orderBy('t.due_at')->limit(1000)
    ->get(['t.*','p.code as project_code','u.name as assignee','parent.title as parent_title'])]]);
 }
 public function createTask(Request $r,string $projectId){$p=$this->project($r,$projectId);$this->canEdit($r,$p);
  $co=$r->user()->company_id;
  $data=$r->validate(['title'=>['required','string','min:2','max:255'],'parent_id'=>['nullable','ulid'],
   'assignee_id'=>['nullable','ulid',Rule::exists('users','id')->where('company_id',$co)],
   'due_at'=>['nullable','date'],'status'=>['nullable',Rule::in(['todo','in_progress','blocked','done'])]]);
  if(!empty($data['parent_id']))abort_unless(DB::table('project_tasks')->where('project_id',$projectId)
   ->where('id',$data['parent_id'])->exists(),422,'Induk task harus dalam project yang sama.');
  return DB::transaction(function()use($r,$projectId,$data){$id=(string)Str::ulid();$now=now();
   DB::table('project_tasks')->insert(['id'=>$id,'project_id'=>$projectId,'title'=>$data['title'],
    'parent_id'=>$data['parent_id']??null,'assignee_id'=>$data['assignee_id']??null,
    'status'=>$data['status']??'todo','progress'=>($data['status']??'')==='done'?100:0,
    'due_at'=>$data['due_at']??null,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'project_task.created','project_task',$id,null,['project_id'=>$projectId]);
   return response()->json(['data'=>DB::table('project_tasks')->find($id)],201);
  });
 }
 public function updateTask(Request $r,string $id){
  $data=$r->validate(['title'=>['sometimes','string','min:2','max:255'],
   'status'=>['sometimes',Rule::in(['todo','in_progress','blocked','done'])],
   'progress'=>['sometimes','integer','between:0,100'],'due_at'=>['sometimes','nullable','date'],
   'assignee_id'=>['sometimes','nullable','ulid',Rule::exists('users','id')->where('company_id',$r->user()->company_id)]]);
  return DB::transaction(function()use($r,$id,$data){$task=$this->task($r,$id,true);
   abort_unless($r->user()->canManageRecords() || $r->user()->id===$task->manager_id || $r->user()->id===$task->assignee_id,403);
   if(($data['status']??null)==='done')$data['progress']=100;
   elseif(isset($data['progress'])&&$data['progress']===100)abort_unless(($data['status']??$task->status)==='done',422,'Progress 100% harus Done.');
   if(isset($data['status'])&&$data['status']==='todo'&&$task->status==='done')abort_unless($r->user()->canManageRecords(),403);
   DB::table('project_tasks')->where('id',$id)->update($data+['updated_at'=>now()]);
   AuditService::record($r->user(),'project_task.updated','project_task',$id,['status'=>$task->status,'progress'=>$task->progress],$data);
   return response()->json(['data'=>DB::table('project_tasks')->find($id)]);
  });
 }
 public function deleteTask(Request $r,string $id){
  return DB::transaction(function()use($r,$id){$task=$this->task($r,$id,true);$this->canEdit($r,$task);
   abort_unless(!DB::table('project_tasks')->where('parent_id',$id)->exists(),409,'Hapus subtask dahulu.');
   DB::table('project_tasks')->where('id',$id)->delete();
   AuditService::record($r->user(),'project_task.deleted','project_task',$id,['title'=>$task->title]);
   return response()->noContent();
  });
 }
}
