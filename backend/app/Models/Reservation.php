<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

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

    protected $appends = ['is_overstay'];

    protected function casts(): array
    {
        return [
            'check_in' => 'date:Y-m-d',
            'check_out' => 'date:Y-m-d',
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

    public function scopeOverstay(Builder $query)
    {
        $query->where('status', 'checked_in')
            ->where('check_out', '<', now()->startOfDay()->toDateString());
    }

    public function scopeOverlapping(Builder $query, string $checkIn, string $checkOut)
    {
        $query->active()
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn);
    }

    public static function generateReservationNumber(): string
    {
        $year = now()->year;
        $lastId = static::whereBetween('created_at', ["$year-01-01 00:00:00", "$year-12-31 23:59:59"])->max('id') ?? 0;

        return 'BK-'.$year.'-'.str_pad($lastId + 1, 4, '0', STR_PAD_LEFT).'-'.strtoupper(Str::random(4));
    }

    public static function createWithNumber(array $attributes): self
    {
        for ($attempt = 0; $attempt < 3; $attempt++) {
            try {
                $attributes['reservation_number'] = static::generateReservationNumber();

                return static::create($attributes);
            } catch (QueryException $e) {
                if (! str_contains($e->getMessage(), 'reservations.reservation_number')) {
                    throw $e;
                }
            }
        }

        throw new QueryException('', 'reservations insert', [], new \Exception('Unable to allocate a unique reservation number.'));
    }

    protected function getIsOverstayAttribute(): bool
    {
        return $this->status === 'checked_in'
            && $this->check_out !== null
            && $this->check_out->lt(now()->startOfDay());
    }
}
