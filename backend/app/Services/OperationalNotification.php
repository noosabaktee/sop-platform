<?php
namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Database-only notifications: no claim of external email or WhatsApp delivery. */
final class OperationalNotification {
 public function toUser(string $userId,string $event,array $payload):void{
  DB::table('notifications')->insert(['id'=>(string)Str::uuid(),
   'type'=>'App\\Notifications\\SopBusinessNotification',
   'notifiable_type'=>'App\\Models\\User','notifiable_id'=>$userId,
   'data'=>json_encode(['event'=>$event]+$payload,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),
   'created_at'=>now(),'updated_at'=>now()]);
 }
 public function toApprovers(string $companyId,string $requesterId,string $event,array $payload):void{
  $users=DB::table('users')->where('company_id',$companyId)->where('is_active',true)
   ->whereIn('role',['super_admin','admin','manager'])->where('id','!=',$requesterId)->pluck('id');
  foreach($users as $id)$this->toUser((string)$id,$event,$payload);
 }
}
