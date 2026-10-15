<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessRecord extends Model
{
    use HasUlids,SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['company_id', 'created_by', 'updated_by', 'route', 'view_key', 'table_index', 'cells', 'fields', 'status', 'version'];

    protected function casts(): array
    {
        return ['cells' => 'array', 'fields' => 'array', 'version' => 'integer', 'table_index' => 'integer'];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
