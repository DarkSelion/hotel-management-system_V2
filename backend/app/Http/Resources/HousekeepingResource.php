<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HousekeepingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'room' => new RoomResource($this->whenLoaded('room')),
            'assigned_to' => new UserResource($this->whenLoaded('assignedTo')),
            'status' => $this->status,
            'priority' => $this->priority,
            'task_type' => $this->task_type,
            'notes' => $this->notes,
            'scheduled_date' => $this->scheduled_date,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
        ];
    }
}
