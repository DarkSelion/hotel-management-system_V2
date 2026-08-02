<?php

namespace App\Console\Commands;

use App\Services\OverdueReservationService;
use Illuminate\Console\Command;

class DetectOverdueReservations extends Command
{
    protected $signature = 'reservations:detect-overdue';
    protected $description = 'Detect and flag overdue reservations for No Show review';

    public function handle(OverdueReservationService $service): int
    {
        $result = $service->detectAndFlagOverdue();

        $this->info("Processed overdue reservations:");
        $this->line("  Total flagged: {$result['count']}");

        if ($result['count'] > 0) {
            $this->info("Reservation IDs: " . implode(', ', $result['reservation_ids']));
        }

        return self::SUCCESS;
    }
}