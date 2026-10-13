<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class GridSnapshot extends Model {
    use HasUlids;
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['company_id', 'updated_by', 'route', 'panel_id', 'rows', 'version'];
    protected function casts(): array { return ['rows' => 'array', 'version' => 'integer']; }
}
