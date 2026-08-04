<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OverstayTest extends TestCase
{
    use RefreshDatabase;

    protected function guest(array $overrides = []): Guest
    {
        return Guest::create(array_merge([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => uniqid('guest') . '@example.com',
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

    protected function staff(): User
    {
        $role = \App\Models\Role::create(['name' => 'Receptionist', 'slug' => 'receptionist']);

        return User::create([
            'name' => 'Staff User',
            'email' => 'staff@test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
        ]);
    }

    protected function roomType(): RoomType
    {
        return RoomType::create([
            'name' => 'Deluxe',
            'slug' => 'deluxe-' . uniqid(),
            'base_price' => 1000,
            'capacity' => 2,
            'max_adults' => 2,
            'max_children' => 1,
            'is_active' => true,
        ]);
    }

    protected function room(): Room
    {
        return Room::create([
            'room_number' => uniqid('R'),
            'room_type_id' => $this->roomType()->id,
            'floor' => 1,
            'status' => 'occupied',
            'cleaning_status' => 'clean',
            'capacity' => 2,
            'is_active' => true,
        ]);
    }

    protected function reservation(?Room $room = null, array $overrides = []): Reservation
    {
        $guest = $this->guest();
        $room = $room ?? $this->room();
        $id = Reservation::max('id') ?? 0;

        return Reservation::create(array_merge([
            'reservation_number' => 'BK-OV-' . ($id + 1),
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'status' => 'checked_in',
            'check_in' => now()->subDays(3)->format('Y-m-d'),
            'check_out' => now()->subDays(1)->format('Y-m-d'),
            'adults' => 2,
            'children' => 0,
            'price_per_night' => 1000,
            'total_nights' => 2,
            'subtotal' => 2000,
            'discount_percent' => 0,
            'discount_amount' => 0,
            'tax_percent' => 10,
            'tax_amount' => 200,
            'total_amount' => 2200,
            'paid_amount' => 0,
            'due_amount' => 2200,
            'payment_status' => 'unpaid',
            'source' => 'direct',
        ], $overrides));
    }

    protected function setTaxRate(string $rate): void
    {
        Setting::create(['key' => 'tax_rate', 'value' => $rate, 'group' => 'tax']);
    }

    // =========================================================================
    // SCOPE OVERSTAY + is_overstay ATTRIBUTE
    // =========================================================================

    public function test_scope_overstay_returns_only_checked_in_past_due(): void
    {
        $overstaying = $this->reservation();
        $this->reservation(null, ['status' => 'confirmed']);
        $this->reservation(null, ['check_out' => now()->addDays(2)->format('Y-m-d')]);
        $this->reservation(null, ['status' => 'checked_out']);

        $ids = Reservation::overstay()->pluck('id');

        $this->assertContains($overstaying->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_scope_overstay_ignores_checked_in_with_future_check_out(): void
    {
        $this->reservation(null, ['check_out' => now()->addDays(2)->format('Y-m-d')]);

        $this->assertEquals(0, Reservation::overstay()->count());
    }

    public function test_is_overstay_attribute_serialized_flag(): void
    {
        $overstaying = $this->reservation();
        $current = $this->reservation(null, ['check_out' => now()->addDays(2)->format('Y-m-d')]);
        $checkedOut = $this->reservation(null, ['status' => 'checked_out']);

        $this->assertTrue($overstaying->is_overstay);
        $this->assertFalse($current->is_overstay);
        $this->assertFalse($checkedOut->is_overstay);
    }

    // =========================================================================
    // DASHBOARD STAT
    // =========================================================================

    public function test_dashboard_stats_includes_overstaying_count(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->reservation();
        $this->reservation(null, ['status' => 'confirmed']);

        $this->getJson('/api/dashboard/stats')
            ->assertStatus(200)
            ->assertJsonPath('overstaying', 1);
    }

    public function test_dashboard_stats_overstaying_zero_when_none(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->reservation(null, ['check_out' => now()->addDays(2)->format('Y-m-d')]);

        $this->getJson('/api/dashboard/stats')
            ->assertStatus(200)
            ->assertJsonPath('overstaying', 0);
    }

    // =========================================================================
    // EXTEND STAY
    // =========================================================================

    public function test_extend_stay_recomputes_totals_and_keeps_paid_amount(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $this->setTaxRate('10');

        $reservation = $this->reservation(null, [
            'paid_amount' => 1000,
            'due_amount' => 1200,
            'payment_status' => 'partial',
        ]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/extend-stay", [
            'new_check_out' => now()->addDays(1)->format('Y-m-d'),
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('check_out', now()->addDays(1)->format('Y-m-d'));

        $fresh = $reservation->fresh();
        $this->assertEquals(4, $fresh->total_nights);
        $this->assertEquals(4000, (float) $fresh->subtotal);
        $this->assertEquals(400, (float) $fresh->tax_amount);
        $this->assertEquals(4400, (float) $fresh->total_amount);
        $this->assertEquals(1000, (float) $fresh->paid_amount);
        $this->assertEquals(3400, (float) $fresh->due_amount);
        $this->assertFalse($fresh->is_overstay);
    }

    public function test_extend_stay_uses_live_tax_rate_setting(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $this->setTaxRate('5');

        $reservation = $this->reservation();

        $this->postJson("/api/reservations/{$reservation->id}/extend-stay", [
            'new_check_out' => now()->addDays(1)->format('Y-m-d'),
        ])->assertStatus(200);

        $fresh = $reservation->fresh();
        $this->assertEquals(5, (float) $fresh->tax_percent);
        $this->assertEquals(200, (float) $fresh->tax_amount);
        $this->assertEquals(4200, (float) $fresh->total_amount);
    }

    public function test_extend_stay_requires_checked_in_status(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $reservation = $this->reservation(null, ['status' => 'confirmed']);

        $this->postJson("/api/reservations/{$reservation->id}/extend-stay", [
            'new_check_out' => now()->addDays(1)->format('Y-m-d'),
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Only checked-in reservations can be extended.');
    }

    public function test_extend_stay_rejects_date_not_after_current_check_out(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $reservation = $this->reservation();

        $this->postJson("/api/reservations/{$reservation->id}/extend-stay", [
            'new_check_out' => now()->subDays(1)->format('Y-m-d'),
        ])->assertStatus(422)
            ->assertJsonValidationErrors('new_check_out');

        $this->assertEquals(now()->subDays(1)->format('Y-m-d'), $reservation->fresh()->check_out->format('Y-m-d'));
    }

    public function test_extend_stay_rejects_missing_new_check_out(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $reservation = $this->reservation();

        $this->postJson("/api/reservations/{$reservation->id}/extend-stay", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('new_check_out');
    }

    public function test_extend_stay_blocks_when_room_reserved_by_another_guest(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $room = $this->room();
        $this->reservation($room);

        $this->reservation($room, [
            'status' => 'confirmed',
            'check_in' => now()->addDays(1)->format('Y-m-d'),
            'check_out' => now()->addDays(3)->format('Y-m-d'),
        ]);

        $overstaying = Reservation::where('status', 'checked_in')->first();

        $this->postJson("/api/reservations/{$overstaying->id}/extend-stay", [
            'new_check_out' => now()->addDays(2)->format('Y-m-d'),
        ])->assertStatus(422)
            ->assertJsonPath('message', 'The room is already reserved for another guest during the extended period.');
    }

    public function test_extend_stay_logs_activity(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $reservation = $this->reservation();

        $this->postJson("/api/reservations/{$reservation->id}/extend-stay", [
            'new_check_out' => now()->addDays(1)->format('Y-m-d'),
        ])->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $admin->id,
            'action' => 'extended_stay',
            'module' => 'reservations',
            'model_id' => $reservation->id,
        ]);
    }

    public function test_staff_can_extend_stay(): void
    {
        $staff = $this->staff();
        Sanctum::actingAs($staff);

        $reservation = $this->reservation();

        $this->postJson("/api/reservations/{$reservation->id}/extend-stay", [
            'new_check_out' => now()->addDays(1)->format('Y-m-d'),
        ])->assertStatus(200);
    }

    public function test_guest_cannot_extend_stay(): void
    {
        $guest = $this->guest();
        Sanctum::actingAs($guest);

        $reservation = $this->reservation();

        $this->postJson("/api/reservations/{$reservation->id}/extend-stay", [
            'new_check_out' => now()->addDays(1)->format('Y-m-d'),
        ])->assertStatus(403);
    }
}
