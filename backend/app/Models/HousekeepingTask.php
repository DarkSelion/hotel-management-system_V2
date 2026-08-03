<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HousekeepingTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id',
        'assigned_to',
        'status',
        'priority',
        'task_type',
        'notes',
        'scheduled_date',
        'completed_at',
        'inspected_by',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date:Y-m-d',
            'completed_at' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function inspectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }
}
