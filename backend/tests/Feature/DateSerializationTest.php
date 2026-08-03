<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DateSerializationTest extends TestCase
{
    use RefreshDatabase;

    protected static int $counter = 0;
    protected ?User $adminUser = null;

    protected function admin(): User
    {
        if ($this->adminUser) {
            return $this->adminUser;
        }

        $role = Role::create(['name' => 'Administrator', 'slug' => 'admin']);

        return $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
            'is_active' => true,
        ]);
    }

    protected function guest(): Guest
    {
        return Guest::create([
            'first_name' => 'Serial',
            'last_name' => 'Guest',
            'email' => 'serial' . (++self::$counter) . '@example.com',
            'phone' => '09171234567',
            'password' => Hash::make('password'),
        ]);
    }

    protected function makeReservation(array $overrides = []): Reservation
    {
        $guest = $this->guest();
        $type = RoomType::create([
            'name' => 'Standard',
            'slug' => 'serial-type-' . self::$counter,
            'base_price' => 1000,
        ]);
        $room = Room::create([
            'room_number' => '3' . str_pad((string) self::$counter, 2, '0', STR_PAD_LEFT),
            'room_type_id' => $type->id,
            'floor' => 3,
            'status' => 'available',
            'capacity' => 2,
            'is_active' => true,
        ]);

        return Reservation::create(array_merge([
            'reservation_number' => 'BK-SER-' . self::$counter,
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'status' => 'confirmed',
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-12',
            'adults' => 2,
            'children' => 0,
            'price_per_night' => 1000,
            'total_nights' => 2,
            'subtotal' => 2000,
            'total_amount' => 2200,
            'due_amount' => 2200,
            'paid_amount' => 0,
            'discount_percent' => 0,
            'discount_amount' => 0,
            'tax_percent' => 10,
            'tax_amount' => 200,
            'payment_status' => 'unpaid',
            'source' => 'direct',
        ], $overrides));
    }

    protected function makeInvoice(Reservation $reservation, string $issuedDate): Invoice
    {
        return Invoice::create([
            'invoice_number' => 'INV-SER-' . (++self::$counter),
            'reservation_id' => $reservation->id,
            'guest_id' => $reservation->guest_id,
            'amount' => 2200,
            'tax_amount' => 200,
            'discount_amount' => 0,
            'total_amount' => 2200,
            'paid_amount' => 0,
            'due_amount' => 2200,
            'status' => 'draft',
            'issued_date' => $issuedDate,
            'due_date' => $issuedDate,
            'created_by' => $this->admin()->id,
        ]);
    }

    public function test_reservation_dates_serialize_as_local_dates(): void
    {
        Sanctum::actingAs($this->admin());
        $this->makeReservation([
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-12',
        ]);

        $response = $this->getJson('/api/reservations');

        $response->assertOk();
        $response->assertJsonPath('data.0.check_in', '2026-09-10');
        $response->assertJsonPath('data.0.check_out', '2026-09-12');
    }

    public function test_invoice_dates_serialize_as_local_dates(): void
    {
        Sanctum::actingAs($this->admin());
        $reservation = $this->makeReservation();
        $this->makeInvoice($reservation, '2026-09-10');

        $response = $this->getJson('/api/invoices');

        $response->assertOk();
        $response->assertJsonPath('data.0.issued_date', '2026-09-10');
    }
}
