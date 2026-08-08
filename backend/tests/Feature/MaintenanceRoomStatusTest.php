<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\MaintenanceRequest;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceRoomStatusTest extends TestCase
{
    use RefreshDatabase;

    protected static int $roomCounter = 0;
    protected static int $guestCounter = 0;

    protected function admin(): User
    {
        $role = Role::create(['name' => 'Administrator', 'slug' => 'admin']);

        return User::create([
            'name' => 'Admin User',
            'email' => 'admin@maintenance-test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
            'is_active' => true,
        ]);
    }

    protected function guest(array $overrides = []): Guest
    {
        self::$guestCounter++;

        return Guest::create(array_merge([
            'first_name' => 'Guest' . self::$guestCounter,
            'last_name' => 'Doe',
            'email' => 'guest' . self::$guestCounter . '@maintenance-test.com',
            'phone' => '0917000000' . self::$guestCounter,
            'password' => Hash::make('password'),
        ], $overrides));
    }

    protected function roomType(string $slug = 'deluxe', ?float $price = 1000): RoomType
    {
        return RoomType::create([
            'name' => 'Deluxe',
            'slug' => $slug,
            'base_price' => $price,
        ]);
    }

    protected function room(?RoomType $type = null, array $overrides = []): Room
    {
        $type = $type ?? $this->roomType('room-type-' . (++self::$roomCounter));

        return Room::create(array_merge([
            'room_number' => '30' . self::$roomCounter,
            'room_type_id' => $type->id,
            'floor' => 3,
            'status' => 'available',
            'cleaning_status' => 'clean',
            'capacity' => 2,
            'is_active' => true,
        ], $overrides));
    }

    protected function reservation(?Room $room = null, string $status = 'confirmed'): Reservation
    {
        $guest = $this->guest();
        $room = $room ?? $this->room();
        $id = Reservation::max('id') ?? 0;

        return Reservation::create([
            'reservation_number' => 'BK-MT-' . ($id + 1),
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'status' => $status,
            'check_in' => '2026-11-10',
            'check_out' => '2026-11-12',
            'adults' => 2,
            'children' => 0,
            'price_per_night' => 1000,
            'total_nights' => 2,
            'subtotal' => 2000,
            'total_amount' => 2000,
            'due_amount' => 2000,
            'paid_amount' => 0,
            'discount_percent' => 0,
            'discount_amount' => 0,
            'tax_percent' => 0,
            'tax_amount' => 0,
            'payment_status' => 'unpaid',
            'source' => 'direct',
        ]);
    }

    protected function maintenance(Room $room, string $status = 'reported'): MaintenanceRequest
    {
        return MaintenanceRequest::create([
            'room_id' => $room->id,
            'reported_by' => 1,
            'title' => 'Test maintenance issue',
            'description' => 'Something needs fixing',
            'category' => 'electrical',
            'priority' => 'medium',
            'status' => $status,
        ]);
    }

    public function test_reporting_maintenance_marks_available_room_maintenance(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'available']);

        $this->postJson('/api/maintenance', [
            'room_id' => $room->id,
            'title' => 'AC not cooling',
            'category' => 'hvac',
            'priority' => 'high',
        ])->assertCreated();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'maintenance',
        ]);
    }

    public function test_reporting_maintenance_on_occupied_room_keeps_occupied(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'occupied']);

        $this->postJson('/api/maintenance', [
            'room_id' => $room->id,
            'title' => 'TV not working',
            'category' => 'electronics',
        ])->assertCreated();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'occupied',
        ]);
    }

    public function test_completing_maintenance_frees_room_to_available(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'maintenance']);
        $request = $this->maintenance($room);

        $this->putJson("/api/maintenance/{$request->id}/status", ['status' => 'completed'])->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'available',
        ]);
    }

    public function test_completing_maintenance_with_upcoming_reservation_marks_reserved(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'maintenance']);
        $this->reservation($room, 'confirmed');
        $request = $this->maintenance($room);

        $this->putJson("/api/maintenance/{$request->id}/status", ['status' => 'completed'])->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'reserved',
        ]);
    }

    public function test_cancelling_maintenance_frees_room(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'maintenance']);
        $request = $this->maintenance($room);

        $this->putJson("/api/maintenance/{$request->id}/status", ['status' => 'cancelled'])->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'available',
        ]);
    }

    public function test_completing_one_of_two_open_requests_keeps_maintenance(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'maintenance']);
        $first = $this->maintenance($room);
        $second = $this->maintenance($room);

        $this->putJson("/api/maintenance/{$first->id}/status", ['status' => 'completed'])->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'maintenance',
        ]);
    }

    public function test_deleting_reported_request_frees_room(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'maintenance']);
        $request = $this->maintenance($room);

        $this->deleteJson("/api/maintenance/{$request->id}")->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'available',
        ]);
    }
}
