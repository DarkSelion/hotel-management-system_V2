<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'amount',
        'description',
        'date',
        'receipt',
        'approved_by',
        'created_by',
    ];

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected $appends = ['created_by_user', 'receipt_url'];

    public function getCreatedByUserAttribute()
    {
        $creator = $this->createdBy;

        return $creator ? $creator->only(['id', 'name']) : null;
    }

    public function getReceiptUrlAttribute()
    {
        if (empty($this->receipt)) {
            return null;
        }

        return url('storage/' . ltrim($this->receipt, '/'));
    }
}
