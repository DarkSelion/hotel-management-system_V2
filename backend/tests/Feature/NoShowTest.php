<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\OverdueReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NoShowTest extends TestCase
{
    use RefreshDatabase;

    protected function guest(array $overrides = []): Guest
    {
        return Guest::create(array_merge([
            'first_name' => 'John',
            'last_name' => 'Travolta',
            'email' => 'john@example.com',
            'phone' => '09171234567',
            'password' => Hash::make('password'),
        ], $overrides));
    }

    protected function admin(): User
    {
        $role = \App\Models\Role::create(['name' => 'Admin', 'slug' => 'admin']);

        return User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
        ]);
    }

    protected function roomType(): RoomType
    {
        return RoomType::create([
            'name' => 'Deluxe',
            'slug' => 'deluxe-' . uniqid(),
            'base_price' => 150,
            'capacity' => 2,
            'max_adults' => 2,
            'max_children' => 1,
            'is_active' => true,
        ]);
    }

    protected function room(RoomType $type): Room
    {
        return Room::create([
            'room_number' => uniqid('R'),
            'room_type_id' => $type->id,
            'floor' => 1,
            'status' => 'available',
            'cleaning_status' => 'clean',
            'capacity' => 2,
            'is_active' => true,
        ]);
    }

    protected function createReservation(string $status = 'confirmed', ?string $checkIn = null, ?string $checkOut = null): Reservation
    {
        $guest = $this->guest(['email' => uniqid('guest') . '@example.com']);
        $type = $this->roomType();
        $room = $this->room($type);

        $checkIn = $checkIn ?? now()->subDays(5)->format('Y-m-d');
        $checkOut = $checkOut ?? now()->subDays(3)->format('Y-m-d');

        return Reservation::create([
            'reservation_number' => 'BK-' . now()->year . '-' . random_int(1000, 9999),
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'status' => $status,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'adults' => 2,
            'price_per_night' => 150,
            'total_nights' => 2,
            'subtotal' => 300,
            'tax_amount' => 30,
            'total_amount' => 330,
            'due_amount' => 330,
            'payment_status' => 'unpaid',
            'source' => 'booking_engine',
        ]);
    }

    // =========================================================================
    // NO-SHOW ENDPOINT
    // =========================================================================

    public function test_admin_can_mark_confirmed_reservation_as_no_show(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $reservation = $this->createReservation('confirmed');
        $room = $reservation->room;

        $response = $this->postJson("/api/reservations/{$reservation->id}/no-show");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'no_show');

        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'status' => 'no_show',
            'no_show_by' => $admin->id,
        ]);

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'available',
        ]);
    }

    public function test_admin_cannot_mark_pending_reservation_as_no_show(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $reservation = $this->createReservation('pending');

        $response = $this->postJson("/api/reservations/{$reservation->id}/no-show");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Only confirmed reservations can be marked as No Show.');

        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'status' => 'pending',
        ]);
    }

    public function test_admin_cannot_mark_checked_in_as_no_show(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $reservation = $this->createReservation('checked_in');

        $response = $this->postJson("/api/reservations/{$reservation->id}/no-show");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Only confirmed reservations can be marked as No Show.');
    }

    public function test_no_show_via_update_status_requires_confirmed(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $reservation = $this->createReservation('pending');

        $response = $this->putJson("/api/reservations/{$reservation->id}", [
            'status' => 'no_show',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot change status from pending to no_show.');
    }

    public function test_no_show_via_update_from_confirmed(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $reservation = $this->createReservation('confirmed');
        $room = $reservation->room;

        $response = $this->putJson("/api/reservations/{$reservation->id}", [
            'status' => 'no_show',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'no_show');

        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'available',
        ]);
    }

    public function test_no_show_logs_activity(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $reservation = $this->createReservation('confirmed');

        $this->postJson("/api/reservations/{$reservation->id}/no-show");

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'marked_no_show',
            'module' => 'reservations',
            'model_id' => $reservation->id,
        ]);
    }

    // =========================================================================
    // OVERDUE DETECTION SERVICE
    // =========================================================================

    public function test_overdue_detection_flags_confirmed_past_checkout(): void
    {
        $reservation = $this->createReservation('confirmed', now()->subDays(5)->format('Y-m-d'), now()->subDays(3)->format('Y-m-d'));

        $service = new OverdueReservationService();
        $result = $service->detectAndFlagOverdue();

        $this->assertEquals(1, $result['count']);
        $this->assertContains($reservation->id, $result['reservation_ids']);
        $this->assertTrue($reservation->fresh()->is_overdue);
        $this->assertNotNull($reservation->fresh()->overdue_at);
    }

    public function test_overdue_detection_ignores_pending_reservations(): void
    {
        $reservation = $this->createReservation('pending', now()->subDays(5), now()->subDays(3));

        $service = new OverdueReservationService();
        $result = $service->detectAndFlagOverdue();

        $this->assertEquals(0, $result['count']);
        $this->assertFalse($reservation->fresh()->is_overdue);
    }

    public function test_overdue_detection_ignores_cancelled_reservations(): void
    {
        $reservation = $this->createReservation('cancelled', now()->subDays(5), now()->subDays(3));

        $service = new OverdueReservationService();
        $result = $service->detectAndFlagOverdue();

        $this->assertEquals(0, $result['count']);
        $this->assertFalse($reservation->fresh()->is_overdue);
    }

    public function test_overdue_detection_ignores_already_flagged(): void
    {
        $reservation = $this->createReservation('confirmed', now()->subDays(5), now()->subDays(3));
        $reservation->update(['is_overdue' => true]);

        $service = new OverdueReservationService();
        $result = $service->detectAndFlagOverdue();

        $this->assertEquals(0, $result['count']);
    }

    public function test_overdue_detection_flags_multiple_reservations(): void
    {
        $this->createReservation('confirmed', now()->subDays(5), now()->subDays(3));
        $this->createReservation('confirmed', now()->subDays(10), now()->subDays(8));

        $service = new OverdueReservationService();
        $result = $service->detectAndFlagOverdue();

        $this->assertEquals(2, $result['count']);
    }

    public function test_overdue_detection_logs_activity(): void
    {
        $reservation = $this->createReservation('confirmed', now()->subDays(5), now()->subDays(3));

        $service = new OverdueReservationService();
        $service->detectAndFlagOverdue();

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'flagged_overdue',
            'module' => 'reservations',
            'model_id' => $reservation->id,
        ]);
    }

    // =========================================================================
    // RATE LIMITING
    // =========================================================================

    public function test_overdue_detection_command_runs(): void
    {
        $this->artisan('reservations:detect-overdue')
            ->expectsOutput('Processed overdue reservations:')
            ->assertExitCode(0);
    }
}
