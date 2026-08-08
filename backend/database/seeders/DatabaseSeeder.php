<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            SettingsSeeder::class,
            UserSeeder::class,
            GuestSeeder::class,
            RoomTypeSeeder::class,
            RoomSeeder::class,
            ReservationSeeder::class,
            PaymentSeeder::class,
            HousekeepingSeeder::class,
            TechnicianSeeder::class,
            MaintenanceSeeder::class,
            ActivityLogSeeder::class,
            RoomImageSeeder::class,
        ]);
    }
}
