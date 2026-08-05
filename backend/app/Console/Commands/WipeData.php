<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WipeData extends Command
{
    protected $signature = 'app:wipe-data {--force : Skip confirmation prompt}';

    protected $description = 'Wipe all transactional data (guests, reservations, payments, etc.) while keeping users, roles, settings, rooms, and room types';

    protected $keepTables = [
        'users',
        'roles',
        'permissions',
        'role_permission',
        'settings',
        'rooms',
        'room_types',
        'amenities',
        'room_amenity',
        'room_images',
        'personal_access_tokens',
        'password_reset_tokens',
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'failed_jobs',
        'job_batches',
        'migrations',
    ];

    public function handle(): int
    {
        if (!$this->option('force')) {
            if (!$this->confirm('This will DELETE all guests, reservations, payments, invoices, housekeeping, maintenance, expenses, and inventory data. Users and settings will be preserved. Continue?')) {
                $this->info('Cancelled.');
                return self::SUCCESS;
            }
        }

        $allTables = Schema::getTableListing();

        // Strip database prefix (e.g. "hotel_management.users" → "users")
        $stripPrefix = function (string $name): string {
            $parts = explode('.', $name);
            return end($parts);
        };

        $wipeTables = [];
        foreach ($allTables as $table) {
            $clean = $stripPrefix($table);
            if (!in_array($clean, $this->keepTables)) {
                $wipeTables[] = $table;
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        $count = 0;
        foreach ($wipeTables as $table) {
            DB::table($table)->truncate();
            $count++;
        }

        DB::table('rooms')->update([
            'status' => 'available',
            'cleaning_status' => 'clean',
        ]);

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');

        $this->info("Done. Wiped {$count} tables. Users, roles, settings, rooms, and room types preserved.");
        return self::SUCCESS;
    }
}
