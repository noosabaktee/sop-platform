<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasUlids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['company_id', 'customer_id', 'owner_id', 'number', 'status', 'currency', 'subtotal', 'tax', 'total', 'valid_until', 'version'];

    protected function casts(): array
    {
        return ['valid_until' => 'date', 'subtotal' => 'decimal:2', 'tax' => 'decimal:2', 'total' => 'decimal:2'];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function salesOrder()
    {
        return $this->hasOne(SalesOrder::class);
    }
}
