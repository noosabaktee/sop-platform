<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
class CorporateMeetingController extends Controller {
 private function guard(Request $r):void {abort_unless(in_array($r->user()->role,['super_admin','admin','manager','corporate_secretary'],true),403);}
 private function meeting(Request $r,string $id,bool $lock=false):object{$q=DB::table('corporate_meetings')->where('company_id',$r->user()->company_id)->where('id',$id);$m=($lock?$q->lockForUpdate():$q)->first();abort_unless($m,404);return $m;}
 public function index(Request $r){return response()->json(['data'=>DB::table('corporate_meetings')->where('company_id',$r->user()->company_id)->orderByDesc('starts_at')->limit(200)->get()]);}
 public function show(Request $r,string $id){$m=$this->meeting($r,$id);return response()->json(['data'=>['meeting'=>$m,'resolutions'=>DB::table('corporate_resolutions')->where('meeting_id',$m->id)->get()]]);}
 public function create(Request $r){$this->guard($r);$d=$r->validate(['kind'=>['required',Rule::in(['general','rups_annual','rups_extraordinary','board'])],
   'title'=>['required','string','max:255'],'starts_at'=>['required','date'],'location'=>['nullable','string','max:255'],
   'total_shares'=>['nullable','integer','min:0'],'present_shares'=>['nullable','integer','min:0']]);
  abort_unless(($d['present_shares']??0)<=($d['total_shares']??0),422,'Saham hadir tidak boleh melebihi total saham.');
  $id=(string)Str::ulid();$now=now();DB::table('corporate_meetings')->insert($d+['id'=>$id,'company_id'=>$r->user()->company_id,
   'created_by'=>$r->user()->id,'status'=>'draft','created_at'=>$now,'updated_at'=>$now]);
  AuditService::record($r->user(),'corporate.meeting.created','corporate_meeting',$id);
  return response()->json(['data'=>DB::table('corporate_meetings')->find($id)],201);
 }
 public function update(Request $r,string $id){$this->guard($r);$d=$r->validate(['title'=>['sometimes','string','max:255'],
   'starts_at'=>['sometimes','date'],'location'=>['sometimes','nullable','string','max:255'],
   'total_shares'=>['sometimes','integer','min:0'],'present_shares'=>['sometimes','integer','min:0'],
   'status'=>['sometimes',Rule::in(['draft','scheduled','held'])], 'minutes'=>['sometimes','nullable','string','max:15000']]);
  return DB::transaction(function()use($r,$id,$d){$m=$this->meeting($r,$id,true);abort_unless($m->status!=='closed',409,'Rapat sudah ditutup.');
   abort_unless(($d['present_shares']??$m->present_shares)<=($d['total_shares']??$m->total_shares),422);
   $transitions=['draft'=>['draft','scheduled'],'scheduled'=>['scheduled','held'],'held'=>['held']];
   if(isset($d['status']))abort_unless(in_array($d['status'],$transitions[$m->status]??[],true),409,'Transisi status rapat tidak valid.');
   DB::table('corporate_meetings')->where('id',$id)->update($d+['updated_at'=>now()]);
   AuditService::record($r->user(),'corporate.meeting.updated','corporate_meeting',$id);
   return response()->json(['data'=>DB::table('corporate_meetings')->find($id)]);
  });
 }
 public function resolution(Request $r,string $id){$this->guard($r);
  $d=$r->validate(['title'=>['required','string','max:255'],'description'=>['nullable','string','max:5000'],
   'for_votes'=>['required','integer','min:0'],'against_votes'=>['required','integer','min:0'],'abstain_votes'=>['nullable','integer','min:0']]);
  return DB::transaction(function()use($r,$id,$d){$m=$this->meeting($r,$id,true);abort_unless($m->status==='held',409,'Keputusan hanya saat rapat berlangsung.');
   $votes=$d['for_votes']+$d['against_votes']+($d['abstain_votes']??0);
   abort_unless($votes<=$m->present_shares,422,'Total suara melebihi saham hadir.');
   $yes=$d['for_votes'];$no=$d['against_votes'];$status=$yes>$no?'approved':'rejected';
   $rid=(string)Str::ulid();$now=now();DB::table('corporate_resolutions')->insert($d+['id'=>$rid,'meeting_id'=>$id,'status'=>$status,'created_at'=>$now,'updated_at'=>$now]);
   AuditService::record($r->user(),'corporate.resolution.recorded','corporate_resolution',$rid,null,['status'=>$status]);
   return response()->json(['data'=>DB::table('corporate_resolutions')->find($rid)],201);
  });
 }
 public function close(Request $r,string $id){$this->guard($r);
  return DB::transaction(function()use($r,$id){$m=$this->meeting($r,$id,true);
   if($m->status==='closed')return response()->json(['data'=>$m,'already_processed'=>true]);
   abort_unless($m->status==='held'&&trim((string)$m->minutes)!=='',409,'Minutes of Meeting harus diisi sebelum ditutup.');
   
   $resolutions=DB::table('corporate_resolutions')->where('meeting_id',$id)->get();
   $resText='';
   foreach($resolutions as $idx=>$res){
    $num=$idx+1;
    $resText.="{$num}. {$res->title} [Status: {$res->status}]\n   Setuju: {$res->for_votes}, Tolak: {$res->against_votes}, Abstain: {$res->abstain_votes}\n";
    if(!empty($res->description)){$resText.="   Keterangan: {$res->description}\n";}
   }
   if($resolutions->isEmpty()){$resText="Tidak ada resolusi tercatat.\n";}

   $content="RISALAH DAN KEPUTUSAN RAPAT PERUSAHAAN (RUPS/BOD)\n"
          ."==================================================\n"
          ."Judul Rapat   : {$m->title}\n"
          ."Jenis         : {$m->kind}\n"
          ."Jadwal/Waktu  : {$m->starts_at}\n"
          ."Lokasi        : ".($m->location??'-')."\n"
          ."Total Saham   : {$m->total_shares}\n"
          ."Saham Hadir   : {$m->present_shares}\n"
          ."Status        : CLOSED (Telah Ditutup)\n\n"
          ."NOTULEN RAPAT (MINUTES OF MEETING):\n"
          ."------------------------------------\n"
          ."{$m->minutes}\n\n"
          ."DAFTAR KEPUTUSAN / RESOLUSI:\n"
          ."----------------------------\n"
          .$resText;

   $path="documents/{$m->company_id}/rups_{$id}.txt";
   Storage::disk('local')->put($path,$content);
   $sha256=hash('sha256',$content);
   $byteSize=strlen($content);
   $now=now();
   $docId=(string)Str::ulid();
   $versionId=(string)Str::ulid();

   DB::table('documents')->insert([
    'id'=>$docId,
    'company_id'=>$m->company_id,
    'owner_id'=>$r->user()->id,
    'title'=>"Risalah RUPS: {$m->title}",
    'category'=>'corporate',
    'folder'=>'RUPS & Resolusi',
    'storage_path'=>$path,
    'mime_type'=>'text/plain',
    'version'=>1,
    'status'=>'approved',
    'approved_by'=>$r->user()->id,
    'approved_at'=>$now,
    'created_at'=>$now,
    'updated_at'=>$now,
   ]);

   DB::table('document_versions')->insert([
    'id'=>$versionId,
    'document_id'=>$docId,
    'version'=>1,
    'uploaded_by'=>$r->user()->id,
    'storage_path'=>$path,
    'original_name'=>"Risalah_RUPS_{$id}.txt",
    'mime_type'=>'text/plain',
    'byte_size'=>$byteSize,
    'sha256'=>$sha256,
    'is_verified'=>true,
    'verified_at'=>$now,
    'created_at'=>$now,
    'updated_at'=>$now,
   ]);

   DB::table('corporate_meetings')->where('id',$id)->update([
    'status'=>'closed',
    'document_id'=>$docId,
    'updated_at'=>$now,
   ]);

   AuditService::record($r->user(),'corporate.meeting.closed','corporate_meeting',$id,['status'=>$m->status],[
    'status'=>'closed',
    'document_id'=>$docId,
    'sha256'=>$sha256,
   ]);

   return response()->json(['data'=>DB::table('corporate_meetings')->find($id)]);
  });
 }
}
