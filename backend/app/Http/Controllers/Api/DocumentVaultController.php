<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Private local storage. A document list entry is not proof of a real file unless it has a version. */
class DocumentVaultController extends Controller {
 private function item(Request $r,string $id,bool $lock=false):object {
  $q=DB::table('documents')->where('company_id',$r->user()->company_id)->where('id',$id);
  $item=($lock?$q->lockForUpdate():$q)->first();abort_unless($item,404);
  abort_unless($item->owner_id===$r->user()->id || $r->user()->canManageRecords(),403);return $item;
 }
 public function index(Request $r){
  $items=DB::table('documents')->where('company_id',$r->user()->company_id)
   ->when(!$r->user()->canManageRecords(),fn($q)=>$q->where('owner_id',$r->user()->id))
   ->where('status','!=','archived')->orderByDesc('updated_at')->paginate(min(max((int)$r->input('per_page',30),1),100));
  return response()->json($items);
 }
 public function upload(Request $r){
  abort_unless(in_array($r->user()->role,['super_admin','admin','manager','sales','finance','project_manager','procurement'],true),403);
  $data=$r->validate(['file'=>['required','file','max:10240','mimes:pdf,png,jpg,jpeg,txt,csv,doc,docx,xls,xlsx'],
   'title'=>['required','string','max:255'],'document_id'=>['nullable','ulid'],
   'status'=>['nullable',Rule::in(['draft','pending_approval'])],
   'category'=>['nullable',Rule::in(['all','project','quotation','sales','purchase','finance','company'])],
   'folder'=>['nullable','string','max:150']]);
  $file=$r->file('file');$co=(string)$r->user()->company_id;$id=$data['document_id']??(string)Str::ulid();
  $versionId=(string)Str::ulid();$path='sop-private/'.$co.'/'.$id.'/'.$versionId;
  $stream=fopen($file->getRealPath(),'rb');
  try{abort_unless(Storage::disk('local')->put($path,$stream),500,'Gagal menulis file ke storage privat.');}
  finally{if(is_resource($stream))fclose($stream);}
  try{
   $doc=DB::transaction(function()use($r,$data,$file,$co,$id,$path,$versionId){
    $now=now();$previous=null;
    if(!empty($data['document_id'])){
     $previous=$this->item($r,$id,true);
     abort_if($previous->status==='archived',409,'Dokumen arsip tidak dapat diubah.');
     abort_unless($previous->owner_id===$r->user()->id||$r->user()->canManageRecords(),403);
     $version=$previous->version+1;
     DB::table('documents')->where('id',$id)->update(['title'=>$data['title'],'storage_path'=>$path,
      'mime_type'=>$file->getMimeType(),'version'=>$version,'status'=>'draft','updated_at'=>$now]);
    }else{
     $version=1;
     DB::table('documents')->insert(['id'=>$id,'company_id'=>$co,'owner_id'=>$r->user()->id,
      'title'=>$data['title'],'category'=>$data['category']??'all','folder'=>$data['folder']??null,
      'storage_path'=>$path,'mime_type'=>$file->getMimeType(),
      'version'=>$version,'status'=>$data['status']??'draft','created_at'=>$now,'updated_at'=>$now]);
    }
    DB::table('document_versions')->insert(['id'=>$versionId,'document_id'=>$id,'version'=>$version,
     'uploaded_by'=>$r->user()->id,'storage_path'=>$path,'original_name'=>$file->getClientOriginalName(),
     'mime_type'=>$file->getMimeType(),'byte_size'=>$file->getSize(),
     'sha256'=>hash_file('sha256',$file->getRealPath()),'created_at'=>$now,'updated_at'=>$now]);
    AuditService::record($r->user(),$previous?'document.versioned':'document.created','document',$id,
     $previous?['version'=>$previous->version]:null,['version'=>$version,'title'=>$data['title']]);
    return DB::table('documents')->find($id);
   });
   return response()->json(['data'=>$doc],201);
  }catch(\Throwable $e){Storage::disk('local')->delete($path);throw $e;}
 }
 public function versions(Request $r,string $id){$this->item($r,$id);
  return response()->json(['data'=>DB::table('document_versions')->where('document_id',$id)->orderByDesc('version')
   ->get(['id','version','original_name','mime_type','byte_size','sha256','created_at'])]);
 }
 public function download(Request $r,string $id,int $version){$doc=$this->item($r,$id);
  abort_if($doc->status==='archived',404);
  $v=DB::table('document_versions')->where('document_id',$id)->where('version',$version)->first();abort_unless($v,404);
  abort_unless(Storage::disk('local')->exists($v->storage_path),404,'File tidak ditemukan di storage.');
  AuditService::record($r->user(),'document.downloaded','document',$id,null,['version'=>$version]);
  return Storage::disk('local')->download($v->storage_path,$v->original_name,['X-Content-Type-Options'=>'nosniff']);
 }
 public function archive(Request $r,string $id){
  return DB::transaction(function()use($r,$id){$doc=$this->item($r,$id,true);
   abort_unless($doc->owner_id===$r->user()->id||$r->user()->canManageRecords(),403);
   DB::table('documents')->where('id',$id)->update(['status'=>'archived','updated_at'=>now()]);
   AuditService::record($r->user(),'document.archived','document',$id,['status'=>$doc->status],['status'=>'archived']);
   return response()->noContent();
  });
 }
}
