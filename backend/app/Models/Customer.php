<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class Customer extends Model {use HasUlids;public $incrementing=false;protected $keyType='string';protected $fillable=['company_id','code','name','email','phone','status'];public function company(){return $this->belongsTo(Company::class);}public function quotations(){return $this->hasMany(Quotation::class);}public function invoices(){return $this->hasMany(Invoice::class);}}
