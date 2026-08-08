<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'room' => new RoomResource($this->whenLoaded('room')),
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'priority' => $this->priority,
            'status' => $this->status,
            'assigned_to' => $this->whenLoaded('assignedTo', fn () => $this->assignedTo ? [
                'id' => $this->assignedTo->id,
                'name' => $this->assignedTo->name,
                'phone' => $this->assignedTo->phone,
                'specialty' => $this->assignedTo->specialty,
            ] : null),
            'estimated_cost' => $this->estimated_cost,
            'actual_cost' => $this->actual_cost,
            'completed_at' => $this->completed_at,
            'images' => $this->whenLoaded('images'),
            'created_at' => $this->created_at,
        ];
    }
}
