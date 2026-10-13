<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** No fake success: provider failures are recorded and returned to the operator. */
class ExternalServicesController extends Controller {
 private function canSend(Request $r):void {abort_unless(in_array($r->user()->role,['super_admin','admin','manager','sales','finance'],true),403);}
 public function status(Request $r){return response()->json(['data'=>[
  'email'=>config('mail.default')!=='log' && config('mail.default')!=='array',
  'whatsapp'=>(bool)(config('services.sop_whatsapp.token') && config('services.sop_whatsapp.phone_id')),
  'ai'=>(bool)config('services.sop_ai.key'),
  'provider_note'=>'Konfigurasi provider harus ditetapkan di backend/.env; status ini bukan verifikasi kredensial.'
 ]]);}
 public function outbox(Request $r){$this->canSend($r);return response()->json(['data'=>DB::table('outbound_messages')
  ->where('company_id',$r->user()->company_id)->orderByDesc('created_at')->limit(100)->get()]);}
 public function send(Request $r){$this->canSend($r);
  $d=$r->validate(['channel'=>['required',Rule::in(['email','whatsapp'])],
   'recipient'=>['required','string','max:255'],'subject'=>['nullable','string','max:255'],
   'content'=>['required','string','max:5000'],'idempotency_key'=>['required','string','min:12','max:120']]);
  if($d['channel']==='email')validator(['recipient'=>$d['recipient']],['recipient'=>'required|email:rfc'])->validate();
  else abort_unless(preg_match('/^\+[1-9][0-9]{7,14}$/D',$d['recipient'])===1,422,'Nomor WhatsApp wajib format internasional +628...');
  if($d['channel']==='email'&&in_array(config('mail.default'),['log','array',null],true))abort(503,'Email provider belum dikonfigurasi (mailer log/array).');
  if($d['channel']==='whatsapp'&&(!config('services.sop_whatsapp.token')||!config('services.sop_whatsapp.phone_id')))abort(503,'WhatsApp Cloud API belum dikonfigurasi.');
  $co=$r->user()->company_id;
  $row=DB::transaction(function()use($r,$co,$d){
   $q=DB::table('outbound_messages')->where('company_id',$co)->where('channel',$d['channel'])->where('idempotency_key',$d['idempotency_key']);
   if($found=$q->lockForUpdate()->first()){
    abort_unless($found->recipient===$d['recipient']&&$found->content===$d['content'],409,'Idempotency key sudah digunakan untuk pesan berbeda.');
    return $found;
   }
   $id=(string)Str::ulid();$now=now();DB::table('outbound_messages')->insert([
    'id'=>$id,'company_id'=>$co,'requested_by'=>$r->user()->id,'channel'=>$d['channel'],
    'recipient'=>$d['recipient'],'subject'=>$d['subject']??null,'content'=>$d['content'],'idempotency_key'=>$d['idempotency_key'],
    'status'=>'pending','created_at'=>$now,'updated_at'=>$now]);return DB::table('outbound_messages')->find($id);
  });
  if($row->status!=='pending')return response()->json(['data'=>$row,'already_processed'=>true]);
  // Optimistically claim this pending row. Parallel duplicate requests are not sent twice.
  $claimed=DB::table('outbound_messages')->where('id',$row->id)->where('status','pending')->update(['status'=>'sending','updated_at'=>now()]);
  if(!$claimed)return response()->json(['data'=>DB::table('outbound_messages')->find($row->id),'already_processed'=>true]);
  try {
   $providerId=null;
   if($d['channel']==='email'){
    Mail::raw($d['content'],function($m)use($d){$m->to($d['recipient'])->subject($d['subject']??'SOP Platform');});
   } else {
    $result=Http::withToken(config('services.sop_whatsapp.token'))->acceptJson()->timeout(12)
     ->post('https://graph.facebook.com/'.config('services.sop_whatsapp.version','v23.0').'/' . config('services.sop_whatsapp.phone_id').'/messages',[
      'messaging_product'=>'whatsapp','to'=>ltrim($d['recipient'],'+'),'type'=>'text','text'=>['body'=>$d['content']]]);
    if(!$result->successful())throw new \RuntimeException('Provider WhatsApp menolak pengiriman (HTTP '.$result->status().').');
    $providerId=$result->json('messages.0.id');
   }
   DB::table('outbound_messages')->where('id',$row->id)->update(['status'=>'sent','provider_reference'=>$providerId,'sent_at'=>now(),'updated_at'=>now()]);
   AuditService::record($r->user(),'communication.sent','outbound_message',$row->id,null,['channel'=>$d['channel']]);
   return response()->json(['data'=>DB::table('outbound_messages')->find($row->id)]);
  }catch(\Throwable $e){
   DB::table('outbound_messages')->where('id',$row->id)->update(['status'=>'failed','error_message'=>mb_substr($e->getMessage(),0,400),'updated_at'=>now()]);
   report($e);return response()->json(['message'=>'Pengiriman gagal. Periksa konfigurasi dan log backend.','data'=>DB::table('outbound_messages')->find($row->id)],502);
  }
 }
 public function chat(Request $r){$this->canSend($r);
  $d=$r->validate(['question'=>['required','string','min:3','max:2000']]);
  abort_unless(config('services.sop_ai.key'),503,'AI API belum dikonfigurasi.');
  // No tenant database is transmitted: only the explicit question, with no tool actions.
  try{$reply=Http::withToken(config('services.sop_ai.key'))->acceptJson()->timeout(20)
   ->post('https://api.openai.com/v1/chat/completions',[
    'model'=>config('services.sop_ai.model','gpt-4.1-mini'),
    'messages'=>[['role'=>'system','content'=>'You are a business writing assistant. Do not claim access to company data.'],
      ['role'=>'user','content'=>$d['question']]],'max_completion_tokens'=>500]);
   abort_unless($reply->successful(),502,'AI provider gagal memproses permintaan.');
   AuditService::record($r->user(),'ai.prompt.completed','ai_request',(string)Str::ulid());
   return response()->json(['data'=>['answer'=>(string)$reply->json('choices.0.message.content')]]);
  }catch(\Illuminate\Http\Client\ConnectionException $e){return response()->json(['message'=>'AI provider tidak dapat dijangkau.'],503);}
 }
}
