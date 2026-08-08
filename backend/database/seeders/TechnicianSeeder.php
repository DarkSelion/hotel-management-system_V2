<?php

namespace Database\Seeders;

use App\Models\Technician;
use Illuminate\Database\Seeder;

class TechnicianSeeder extends Seeder
{
    public function run(): void
    {
        $technicians = [
            ['name' => 'Mario Santos', 'phone' => '0917 555 1201', 'specialty' => 'HVAC / Electrical'],
            ['name' => 'Jun Reyes', 'phone' => '0918 555 1202', 'specialty' => 'Plumbing'],
            ['name' => 'Carlo Cruz', 'phone' => '0919 555 1203', 'specialty' => 'General Repairs'],
        ];

        foreach ($technicians as $data) {
            Technician::updateOrCreate(
                ['name' => $data['name']],
                $data
            );
        }
    }
}
