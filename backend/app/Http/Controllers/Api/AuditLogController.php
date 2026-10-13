<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller {
 public function index(Request $r){
  abort_unless(in_array($r->user()->role,['super_admin','admin','manager','auditor'],true),403);
  $filter=$r->validate(['action'=>['nullable','string','max:100'],
   'entity_type'=>['nullable','string','max:100'],'from'=>['nullable','date'],
   'to'=>['nullable','date','after_or_equal:from'],'per_page'=>['nullable','integer','between:1,100']]);
  $q=DB::table('audit_events as a')->leftJoin('users as u','u.id','=','a.actor_id')
   ->where('a.company_id',$r->user()->company_id);
  if(isset($filter['action']))$q->where('a.action',$filter['action']);
  if(isset($filter['entity_type']))$q->where('a.entity_type',$filter['entity_type']);
  if(isset($filter['from']))$q->whereDate('a.created_at','>=',$filter['from']);
  if(isset($filter['to']))$q->whereDate('a.created_at','<=',$filter['to']);
  return response()->json($q->orderByDesc('a.created_at')->select(['a.id','a.action','a.entity_type',
   'a.entity_id','a.ip_address','a.created_at','u.name as actor'])->paginate($filter['per_page']??50));
 }
}
