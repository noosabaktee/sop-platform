<?php
namespace App\Policies;
use App\Models\User;
use App\Models\BusinessRecord;
class BusinessRecordPolicy {
 public function view(User $user,BusinessRecord $record):bool{return $user->company_id===$record->company_id;}
 public function update(User $user,BusinessRecord $record):bool{return $this->view($user,$record)&&!in_array($record->status,['approved','posted','closed'],true)&&($user->canManageRecords()||$record->created_by===$user->id);}
 public function delete(User $user,BusinessRecord $record):bool{return $this->update($user,$record);}
 public function create(User $user):bool{return $user->is_active;}
}
