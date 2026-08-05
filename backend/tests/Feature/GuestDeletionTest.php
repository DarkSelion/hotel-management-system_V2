<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestDeletionTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        $role = Role::create(['name' => 'Administrator', 'slug' => 'admin']);

        return User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
        ]);
    }

    protected function makeGuestWithHistory(): Guest
    {
        $guest = Guest::create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'phone' => '09171234567',
            'password' => Hash::make('password'),
        ]);
        $type = RoomType::create([
            'name' => 'Deluxe',
            'slug' => 'deluxe',
            'base_price' => 1000,
        ]);
        $room = Room::create([
            'room_number' => '101',
            'room_type_id' => $type->id,
            'floor' => 1,
            'status' => 'available',
            'capacity' => 2,
        ]);

        Reservation::create([
            'reservation_number' => 'BK-TEST-'.random_int(1000, 9999),
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'status' => 'cancelled',
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-12',
            'adults' => 2,
            'price_per_night' => 1000,
            'total_nights' => 2,
            'subtotal' => 2000,
            'total_amount' => 2000,
            'due_amount' => 2000,
        ]);

        return $guest;
    }

    public function test_admin_cannot_delete_guest_with_history(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $guest = $this->makeGuestWithHistory();

        $this->deleteJson("/api/guests/{$guest->id}")->assertStatus(422);

        $this->assertDatabaseHas('guests', ['id' => $guest->id]);
        $this->assertDatabaseCount('reservations', 1);
    }

    public function test_guest_without_history_can_be_deleted(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $guest = Guest::create([
            'first_name' => 'No',
            'last_name' => 'History',
            'email' => 'nohistory@example.com',
            'phone' => '09171234567',
            'password' => Hash::make('password'),
        ]);

        $this->deleteJson("/api/guests/{$guest->id}")->assertStatus(200);

        $this->assertDatabaseMissing('guests', ['id' => $guest->id]);
    }

    public function test_guest_cannot_delete_account_with_history(): void
    {
        $guest = $this->makeGuestWithHistory();
        Sanctum::actingAs($guest);

        $this->deleteJson('/api/public/profile')->assertStatus(422);

        $this->assertDatabaseHas('guests', ['id' => $guest->id]);
    }
}
