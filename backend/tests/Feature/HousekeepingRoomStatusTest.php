<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\HousekeepingTask;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HousekeepingRoomStatusTest extends TestCase
{
    use RefreshDatabase;

    protected static int $roomCounter = 0;
    protected static int $guestCounter = 0;

    protected function admin(): User
    {
        $role = Role::create(['name' => 'Administrator', 'slug' => 'admin']);

        return User::create([
            'name' => 'Admin User',
            'email' => 'admin@housekeeping-test.com',
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
            'email' => 'guest' . self::$guestCounter . '@housekeeping-test.com',
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
            'reservation_number' => 'BK-HK-' . ($id + 1),
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'status' => $status,
            'check_in' => '2026-10-10',
            'check_out' => '2026-10-12',
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

    protected function task(Room $room, string $status = 'pending'): HousekeepingTask
    {
        return HousekeepingTask::create([
            'room_id' => $room->id,
            'status' => $status,
            'priority' => 'normal',
            'task_type' => 'Daily Cleaning',
            'scheduled_date' => '2026-10-10',
            'created_by' => 1,
        ]);
    }

    public function test_completing_task_cleans_dirty_room_and_frees_it(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'dirty', 'cleaning_status' => 'dirty']);
        $task = $this->task($room);

        $this->put("/api/housekeeping/{$task->id}/status", ['status' => 'completed'])->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'available',
            'cleaning_status' => 'clean',
        ]);
    }

    public function test_completing_task_on_dirty_room_with_upcoming_reservation_marks_reserved(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'dirty', 'cleaning_status' => 'dirty']);
        $this->reservation($room, 'confirmed');
        $task = $this->task($room);

        $this->put("/api/housekeeping/{$task->id}/status", ['status' => 'completed'])->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'reserved',
            'cleaning_status' => 'clean',
        ]);
    }

    public function test_completing_task_on_occupied_room_does_not_change_status(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'occupied', 'cleaning_status' => 'dirty']);
        $this->reservation($room, 'checked_in');
        $task = $this->task($room);

        $this->put("/api/housekeeping/{$task->id}/status", ['status' => 'completed'])->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'occupied',
            'cleaning_status' => 'clean',
        ]);
    }

    public function test_completing_task_on_maintenance_room_keeps_maintenance(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room(overrides: ['status' => 'maintenance', 'cleaning_status' => 'dirty']);
        $task = $this->task($room);

        $this->put("/api/housekeeping/{$task->id}/status", ['status' => 'completed'])->assertOk();

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'maintenance',
            'cleaning_status' => 'clean',
        ]);
    }

    // ─── Pending-task deletion (C4) ───────────────────────────

    public function test_admin_can_delete_pending_task(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room();
        $task = $this->task($room);

        $response = $this->deleteJson("/api/housekeeping/{$task->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('housekeeping_tasks', ['id' => $task->id]);
    }

    public function test_delete_non_pending_task_is_rejected(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room();
        $task = $this->task($room, 'completed');

        $response = $this->deleteJson("/api/housekeeping/{$task->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('housekeeping_tasks', ['id' => $task->id]);
    }

    public function test_non_admin_cannot_delete_task(): void
    {
        $role = Role::create(['name' => 'Receptionist', 'slug' => 'receptionist']);
        $staff = User::create([
            'name' => 'Receptionist User',
            'email' => 'receptionist@housekeeping-test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
            'is_active' => true,
        ]);
        Sanctum::actingAs($staff);

        $room = $this->room();
        $task = $this->task($room);

        $response = $this->deleteJson("/api/housekeeping/{$task->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('housekeeping_tasks', ['id' => $task->id]);
    }
}
