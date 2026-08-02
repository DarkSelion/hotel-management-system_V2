<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_number',
        'guest_id',
        'room_id',
        'status',
        'check_in',
        'check_out',
        'adults',
        'children',
        'price_per_night',
        'total_nights',
        'subtotal',
        'discount_percent',
        'discount_amount',
        'tax_percent',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'due_amount',
        'payment_status',
        'special_requests',
        'notes',
        'source',
        'confirmed_by',
        'checked_in_by',
        'checked_out_by',
        'created_by',
        'no_show_by',
        'is_overdue',
        'overdue_at',
        'checked_in_at',
        'checked_out_at',
    ];

    protected function casts(): array
    {
        return [
            'check_in' => 'date',
            'check_out' => 'date',
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'overdue_at' => 'datetime',
            'is_overdue' => 'boolean',
            'price_per_night' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_percent' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_amount' => 'decimal:2',
        ];
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function checkedInBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    public function checkedOutBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive(Builder $query)
    {
        $query->whereNotIn('status', ['cancelled', 'checked_out', 'no_show']);
    }
}
