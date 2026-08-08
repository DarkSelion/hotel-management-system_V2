<?php

namespace Database\Seeders;

use App\Models\MaintenanceRequest;
use App\Models\Room;
use App\Models\Technician;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class MaintenanceSeeder extends Seeder
{
    public function run(): void
    {
        $rooms = Room::all()->keyBy('room_number');
        $technicians = Technician::all()->keyBy('name');
        $tech = fn (string $name) => $technicians->has($name) ? $technicians[$name]->id : null;

        $requests = [
            [
                'room_id' => $rooms['104']->id, 'reported_by' => 3, 'assigned_to' => $tech('Mario Santos'),
                'title' => 'AC not cooling',
                'description' => 'Air conditioning unit is blowing warm air. Room temperature cannot go below 26°C.',
                'category' => 'hvac', 'priority' => 'high', 'status' => 'in_progress',
                'estimated_cost' => 350.00, 'actual_cost' => null,
                'completed_at' => null, 'notes' => 'Technician scheduled for tomorrow morning',
            ],
            [
                'room_id' => $rooms['207']->id, 'reported_by' => 4, 'assigned_to' => $tech('Jun Reyes'),
                'title' => 'Leaking faucet in bathroom',
                'description' => 'Bathroom sink faucet is leaking continuously. Water pooling on counter.',
                'category' => 'plumbing', 'priority' => 'medium', 'status' => 'assigned',
                'estimated_cost' => 150.00, 'actual_cost' => null,
                'completed_at' => null, 'notes' => 'Requires replacement of cartridge',
            ],
            [
                'room_id' => $rooms['305']->id, 'reported_by' => 2, 'assigned_to' => null,
                'title' => 'Elevator near penthouse making noise',
                'description' => 'Guests reported unusual grinding noise from the elevator shaft near the penthouse floor.',
                'category' => 'elevator', 'priority' => 'urgent', 'status' => 'reported',
                'estimated_cost' => 2000.00, 'actual_cost' => null,
                'completed_at' => null, 'notes' => 'Elevator company notified',
            ],
            [
                'room_id' => $rooms['101']->id, 'reported_by' => 3, 'assigned_to' => $tech('Carlo Cruz'),
                'title' => 'Lobby light fixture replacement',
                'description' => 'Three bulbs in the main lobby chandelier need replacement.',
                'category' => 'electrical', 'priority' => 'low', 'status' => 'completed',
                'estimated_cost' => 75.00, 'actual_cost' => 85.00,
                'completed_at' => Carbon::now()->subDays(3), 'notes' => 'Replaced with LED equivalents',
            ],
            [
                'room_id' => $rooms['108']->id, 'reported_by' => 4, 'assigned_to' => $tech('Carlo Cruz'),
                'title' => 'TV not working',
                'description' => 'Smart TV in room 108 will not turn on. Power indicator light is off.',
                'category' => 'electronics', 'priority' => 'medium', 'status' => 'assigned',
                'estimated_cost' => 500.00, 'actual_cost' => null,
                'completed_at' => null, 'notes' => 'May need replacement - checking warranty',
            ],
        ];

        foreach ($requests as $data) {
            MaintenanceRequest::create($data);
        }
    }
}
