<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasUlids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['company_id', 'customer_id', 'sales_order_id', 'number', 'amount', 'paid_amount', 'status', 'due_date'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'paid_amount' => 'decimal:2', 'due_date' => 'date'];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
