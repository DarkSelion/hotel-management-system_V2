<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@hotel.com')->first();

        if (!$admin) {
            return;
        }

        $activities = [
            ['action' => 'created', 'module' => 'reservations', 'description' => 'Created reservation #BK-2024-0001', 'minutes_ago' => 420],
            ['action' => 'checked_in', 'module' => 'reservations', 'description' => 'Checked in reservation #BK-2024-0001', 'minutes_ago' => 380],
            ['action' => 'created', 'module' => 'payments', 'description' => 'Recorded payment of ₱12,500.00 for reservation #BK-2024-0001', 'minutes_ago' => 375],
            ['action' => 'created', 'module' => 'guests', 'description' => 'Added new guest Maria Garcia', 'minutes_ago' => 360],
            ['action' => 'created', 'module' => 'reservations', 'description' => 'Created reservation #BK-2024-0002', 'minutes_ago' => 300],
            ['action' => 'status_changed', 'module' => 'housekeeping', 'description' => 'Housekeeping task #1 marked as in_progress', 'minutes_ago' => 240],
            ['action' => 'status_changed', 'module' => 'housekeeping', 'description' => 'Housekeeping task #1 marked as completed', 'minutes_ago' => 180],
            ['action' => 'created', 'module' => 'maintenance', 'description' => 'Reported maintenance: Leaking faucet in Room 205', 'minutes_ago' => 120],
            ['action' => 'created', 'module' => 'expenses', 'description' => 'Created expense: Cleaning supplies (₱3,200.00)', 'minutes_ago' => 90],
            ['action' => 'checked_out', 'module' => 'reservations', 'description' => 'Checked out reservation #BK-2024-0001', 'minutes_ago' => 60],
            ['action' => 'created', 'module' => 'payments', 'description' => 'Recorded payment of ₱8,750.00 for reservation #BK-2024-0002', 'minutes_ago' => 45],
            ['action' => 'updated', 'module' => 'reservations', 'description' => 'Updated reservation #BK-2024-0003', 'minutes_ago' => 30],
            ['action' => 'status_changed', 'module' => 'maintenance', 'description' => 'Maintenance request "Leaking faucet in Room 205" marked as in_progress', 'minutes_ago' => 20],
            ['action' => 'created', 'module' => 'reservations', 'description' => 'Created reservation #BK-2024-0004', 'minutes_ago' => 10],
        ];

        foreach ($activities as $activity) {
            ActivityLog::create([
                'user_id' => $admin->id,
                'action' => $activity['action'],
                'module' => $activity['module'],
                'description' => $activity['description'],
                'created_at' => now()->subMinutes($activity['minutes_ago']),
            ]);
        }
    }
}
