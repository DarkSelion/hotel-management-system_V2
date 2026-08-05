<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $roomTypes = RoomType::all()->keyBy('slug');

        $rooms = [
            // Floor 1: Standard (101-108), Family (109-110)
            ['room_number' => '101', 'room_type_slug' => 'standard-room', 'floor' => 1, 'status' => 'occupied', 'cleaning_status' => 'clean', 'capacity' => 2, 'is_active' => true],
            ['room_number' => '102', 'room_type_slug' => 'standard-room', 'floor' => 1, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 2, 'is_active' => true],
            ['room_number' => '103', 'room_type_slug' => 'standard-room', 'floor' => 1, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 2, 'is_active' => true],
            ['room_number' => '104', 'room_type_slug' => 'standard-room', 'floor' => 1, 'status' => 'maintenance', 'cleaning_status' => 'dirty', 'capacity' => 2, 'is_active' => true],
            ['room_number' => '105', 'room_type_slug' => 'standard-room', 'floor' => 1, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 2, 'is_active' => true],
            ['room_number' => '106', 'room_type_slug' => 'standard-room', 'floor' => 1, 'status' => 'dirty', 'cleaning_status' => 'in_progress', 'capacity' => 2, 'is_active' => true],
            ['room_number' => '107', 'room_type_slug' => 'standard-room', 'floor' => 1, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 2, 'is_active' => true],
            ['room_number' => '108', 'room_type_slug' => 'standard-room', 'floor' => 1, 'status' => 'occupied', 'cleaning_status' => 'clean', 'capacity' => 2, 'is_active' => true],
            ['room_number' => '109', 'room_type_slug' => 'family-room', 'floor' => 1, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 4, 'is_active' => true],
            ['room_number' => '110', 'room_type_slug' => 'family-room', 'floor' => 1, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 4, 'is_active' => true],

            // Floor 2: Deluxe (201-208), Junior Suite (209-210)
            ['room_number' => '201', 'room_type_slug' => 'deluxe-room', 'floor' => 2, 'status' => 'occupied', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '202', 'room_type_slug' => 'deluxe-room', 'floor' => 2, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '203', 'room_type_slug' => 'deluxe-room', 'floor' => 2, 'status' => 'dirty', 'cleaning_status' => 'in_progress', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '204', 'room_type_slug' => 'deluxe-room', 'floor' => 2, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '205', 'room_type_slug' => 'deluxe-room', 'floor' => 2, 'status' => 'occupied', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '206', 'room_type_slug' => 'deluxe-room', 'floor' => 2, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '207', 'room_type_slug' => 'deluxe-room', 'floor' => 2, 'status' => 'maintenance', 'cleaning_status' => 'dirty', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '208', 'room_type_slug' => 'deluxe-room', 'floor' => 2, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '209', 'room_type_slug' => 'junior-suite', 'floor' => 2, 'status' => 'occupied', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '210', 'room_type_slug' => 'junior-suite', 'floor' => 2, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],

            // Floor 3: Junior Suite (301-304), Executive Suite (305)
            ['room_number' => '301', 'room_type_slug' => 'junior-suite', 'floor' => 3, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '302', 'room_type_slug' => 'junior-suite', 'floor' => 3, 'status' => 'dirty', 'cleaning_status' => 'in_progress', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '303', 'room_type_slug' => 'junior-suite', 'floor' => 3, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '304', 'room_type_slug' => 'junior-suite', 'floor' => 3, 'status' => 'occupied', 'cleaning_status' => 'clean', 'capacity' => 3, 'is_active' => true],
            ['room_number' => '305', 'room_type_slug' => 'executive-suite', 'floor' => 3, 'status' => 'available', 'cleaning_status' => 'clean', 'capacity' => 4, 'is_active' => true],
        ];

        foreach ($rooms as $roomData) {
            $slug = $roomData['room_type_slug'];
            unset($roomData['room_type_slug']);
            $roomData['room_type_id'] = $roomTypes[$slug]->id;

            Room::create($roomData);
        }
    }
}
