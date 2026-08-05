<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::whereIn('slug', ['super_admin', 'admin', 'hotel_manager', 'receptionist', 'housekeeping', 'cashier', 'staff'])->get()->keyBy('slug');

        $users = [
            ['name' => 'Super Admin', 'email' => 'palayjohncarlo@gmail.com', 'role_slug' => 'super_admin'],
            ['name' => 'Admin', 'email' => 'admin@hotel.com', 'role_slug' => 'admin'],
            ['name' => 'Hotel Manager', 'email' => 'manager@hotel.com', 'role_slug' => 'hotel_manager'],
            ['name' => 'Receptionist', 'email' => 'reception@hotel.com', 'role_slug' => 'receptionist'],
            ['name' => 'Housekeeping', 'email' => 'housekeeping@hotel.com', 'role_slug' => 'housekeeping'],
            ['name' => 'Cashier', 'email' => 'cashier@hotel.com', 'role_slug' => 'cashier'],
            ['name' => 'Staff', 'email' => 'staff@hotel.com', 'role_slug' => 'staff'],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password'),
                    'role_id' => $roles[$userData['role_slug']]->id,
                    'is_active' => true,
                ]
            );
        }
    }
}
