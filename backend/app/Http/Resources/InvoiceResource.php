<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'reservation_id' => $this->reservation_id,
            'guest_id' => $this->guest_id,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'issued_date' => $this->issued_date,
            'due_date' => $this->due_date,
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
        ];
    }
}
