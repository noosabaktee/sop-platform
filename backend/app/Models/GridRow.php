<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\SoftDeletes;
class GridRow extends Model {
    use HasUlids, SoftDeletes;
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['company_id','grid_snapshot_id','row_key','payload','position','version','created_by','updated_by'];
    protected function casts():array { return ['payload'=>'array','position'=>'integer','version'=>'integer']; }
}
