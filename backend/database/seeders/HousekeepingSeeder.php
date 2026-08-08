<?php

namespace Database\Seeders;

use App\Models\HousekeepingTask;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HousekeepingSeeder extends Seeder
{
    public function run(): void
    {
        $rooms = Room::all()->keyBy('room_number');

        $tasks = [
            [
                'room_id' => $rooms['101']->id, 'assigned_to' => 4,
                'status' => 'completed', 'priority' => 'normal',
                'task_type' => 'Daily Cleaning', 'notes' => 'Standard room cleaning after check-out',
                'scheduled_date' => Carbon::now()->subDays(1), 'completed_at' => Carbon::now()->subDays(1)->addHours(2),
                'created_by' => 3,
            ],
            [
                'room_id' => $rooms['106']->id, 'assigned_to' => 4,
                'status' => 'in_progress', 'priority' => 'high',
                'task_type' => 'Deep Clean', 'notes' => 'Deep cleaning required - guest checked out with pets',
                'scheduled_date' => Carbon::now(), 'completed_at' => null,
                'created_by' => 3,
            ],
            [
                'room_id' => $rooms['203']->id, 'assigned_to' => 4,
                'status' => 'in_progress', 'priority' => 'normal',
                'task_type' => 'Daily Cleaning', 'notes' => 'Turnover cleaning for incoming guest',
                'scheduled_date' => Carbon::now(), 'completed_at' => null,
                'created_by' => 2,
            ],
            [
                'room_id' => $rooms['302']->id, 'assigned_to' => 4,
                'status' => 'in_progress', 'priority' => 'normal',
                'task_type' => 'Daily Cleaning', 'notes' => 'Routine cleaning',
                'scheduled_date' => Carbon::now(), 'completed_at' => null,
                'created_by' => 2,
            ],
            [
                'room_id' => $rooms['205']->id, 'assigned_to' => 4,
                'status' => 'pending', 'priority' => 'normal',
                'task_type' => 'Turn Down', 'notes' => 'Evening turn-down service',
                'scheduled_date' => Carbon::now()->addDay(), 'completed_at' => null,
                'created_by' => 3,
            ],
            [
                'room_id' => $rooms['109']->id, 'assigned_to' => 4,
                'status' => 'pending', 'priority' => 'low',
                'task_type' => 'Restock', 'notes' => 'Restock minibar and amenities',
                'scheduled_date' => Carbon::now()->addDay(), 'completed_at' => null,
                'created_by' => 3,
            ],
            [
                'room_id' => $rooms['305']->id, 'assigned_to' => 4,
                'status' => 'completed', 'priority' => 'high',
                'task_type' => 'Deep Clean', 'notes' => 'Post-stay deep clean for VIP suite',
                'scheduled_date' => Carbon::now()->subDays(2), 'completed_at' => Carbon::now()->subDays(2)->addHours(3),
                'created_by' => 2,
            ],
            [
                'room_id' => $rooms['304']->id, 'assigned_to' => 4,
                'status' => 'pending', 'priority' => 'normal',
                'task_type' => 'Daily Cleaning', 'notes' => 'Quality inspection before guest arrival',
                'scheduled_date' => Carbon::now()->addHours(4), 'completed_at' => null,
                'created_by' => 2,
            ],
        ];

        foreach ($tasks as $data) {
            HousekeepingTask::create($data);
        }
    }
}
