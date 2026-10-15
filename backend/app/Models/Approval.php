<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasUlids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['company_id', 'business_record_id', 'requester_id', 'approver_id', 'status', 'comment', 'decided_at'];

    protected function casts(): array
    {
        return ['decided_at' => 'datetime'];
    }

    public function record()
    {
        return $this->belongsTo(BusinessRecord::class, 'business_record_id');
    }
}
