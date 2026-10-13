<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class User extends Authenticatable {
 use HasApiTokens,Notifiable,HasUlids,HasFactory;
 public $incrementing=false;protected $keyType='string';
 protected $fillable=['company_id','name','email','password','role','is_active'];
 protected $hidden=['password','remember_token'];
 protected function casts():array{return ['email_verified_at'=>'datetime','password'=>'hashed','is_active'=>'boolean'];}
 public function company(){return $this->belongsTo(Company::class);}
 public function canManageRecords():bool{return in_array($this->role,['super_admin','admin','manager'],true);}
}
