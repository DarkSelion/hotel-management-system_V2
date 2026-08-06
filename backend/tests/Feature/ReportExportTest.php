<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportExportTest extends TestCase
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
            'is_active' => true,
        ]);
    }

    protected function roomType(): RoomType
    {
        return RoomType::create([
            'name' => 'Deluxe',
            'slug' => 'deluxe',
            'base_price' => 2500,
            'capacity' => 2,
            'description' => 'Test room type',
        ]);
    }

    protected function room(RoomType $roomType): Room
    {
        return Room::create([
            'room_number' => '101',
            'room_type_id' => $roomType->id,
            'floor' => 1,
            'status' => 'available',
            'cleaning_status' => 'clean',
            'capacity' => 2,
            'is_active' => true,
        ]);
    }

    protected function guest(): Guest
    {
        return Guest::create([
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'email' => 'juan@test.com',
            'phone' => '09171234567',
            'password' => Hash::make('password'),
        ]);
    }

    public function test_csv_export_rejects_invalid_report_type(): void
    {
        Sanctum::actingAs($this->admin());

        $this->getJson('/api/reports/export/invalid?format=csv')
            ->assertStatus(422);
    }

    public function test_revenue_csv_export_returns_download(): void
    {
        Sanctum::actingAs($this->admin());

        $roomType = $this->roomType();
        $room = $this->room($roomType);
        $guest = $this->guest();
        $reservation = Reservation::create([
            'reservation_number' => 'RST-1001',
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'check_in' => '2026-01-05',
            'check_out' => '2026-01-07',
            'status' => 'checked_in',
            'adults' => 2,
            'children' => 0,
            'price_per_night' => 2500,
            'total_nights' => 2,
            'subtotal' => 5000,
            'total_amount' => 5000,
            'paid_amount' => 2500,
            'due_amount' => 2500,
            'payment_status' => 'partial',
        ]);
        Payment::forceCreate([
            'reservation_id' => $reservation->id,
            'guest_id' => $guest->id,
            'amount' => 2500,
            'payment_method' => 'cash',
            'payment_type' => 'partial',
            'status' => 'completed',
            'created_at' => '2026-01-06 10:00:00',
        ]);

        $response = $this->get('/api/reports/export/revenue?format=csv&from=2026-01-01&to=2026-01-31');
        $response->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->assertHeader('Content-Disposition', 'attachment; filename=revenue-report.csv');

        $content = $response->streamedContent();
        $this->assertStringContainsString('Payment Method', $content);
        $this->assertStringContainsString('RST-1001', $content);
    }

    public function test_revenue_pdf_export_returns_pdf(): void
    {
        Sanctum::actingAs($this->admin());

        $this->get('/api/reports/export/revenue?format=pdf&from=2026-01-01&to=2026-01-31')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Content-Disposition', 'attachment; filename=revenue-report.pdf');
    }

    public function test_occupancy_pdf_export_returns_pdf(): void
    {
        Sanctum::actingAs($this->admin());

        $this->get('/api/reports/export/occupancy?format=pdf&from=2026-01-01&to=2026-01-07')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_reservations_pdf_export_returns_pdf(): void
    {
        Sanctum::actingAs($this->admin());

        $this->get('/api/reports/export/reservations?format=pdf&from=2026-01-01&to=2026-01-31')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_pdf_export_rejects_invalid_format(): void
    {
        Sanctum::actingAs($this->admin());

        $this->getJson('/api/reports/export/revenue?format=xlsx')
            ->assertStatus(422);
    }
}
