<?php

namespace Tests\Feature;

use App\Models\Expense;
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

class DateFilterTest extends TestCase
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
            'first_name' => 'DateFilter',
            'last_name' => 'Guest',
            'email' => 'datefilter' . (++self::$counter) . '@example.com',
            'phone' => '09171234567',
            'password' => Hash::make('password'),
        ]);
    }

    protected function makeReservation(array $overrides = []): Reservation
    {
        $guest = $this->guest();
        $type = RoomType::create([
            'name' => 'Standard',
            'slug' => 'type-' . self::$counter,
            'base_price' => 1000,
        ]);
        $room = Room::create([
            'room_number' => '2' . str_pad((string) self::$counter, 2, '0', STR_PAD_LEFT),
            'room_type_id' => $type->id,
            'floor' => 2,
            'status' => 'available',
            'capacity' => 2,
            'is_active' => true,
        ]);

        return Reservation::create(array_merge([
            'reservation_number' => 'BK-DATE-' . self::$counter,
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

    protected function makeExpense(string $date): Expense
    {
        return Expense::create([
            'category' => 'Utilities',
            'amount' => 500,
            'description' => 'Test expense ' . self::$counter,
            'date' => $date,
            'created_by' => $this->admin()->id,
        ]);
    }

    protected function makeInvoice(Reservation $reservation, string $issuedDate): Invoice
    {
        return Invoice::create([
            'invoice_number' => 'INV-DATE-' . (++self::$counter),
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

    public function test_reservations_index_filters_by_date_range(): void
    {
        Sanctum::actingAs($this->admin());
        $inRange = $this->makeReservation([
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-12',
        ]);
        $outOfRange = $this->makeReservation([
            'check_in' => '2026-09-15',
            'check_out' => '2026-09-18',
        ]);

        $response = $this->getJson('/api/reservations?date_from=2026-09-01&date_to=2026-09-14');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($inRange->id, $ids);
        $this->assertNotContains($outOfRange->id, $ids);
    }

    public function test_reservations_index_filters_by_from_date_only(): void
    {
        Sanctum::actingAs($this->admin());
        $before = $this->makeReservation([
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-12',
        ]);
        $after = $this->makeReservation([
            'check_in' => '2026-09-15',
            'check_out' => '2026-09-18',
        ]);

        $response = $this->getJson('/api/reservations?date_from=2026-09-14');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($after->id, $ids);
        $this->assertNotContains($before->id, $ids);
    }

    public function test_expenses_index_filters_by_date_range(): void
    {
        Sanctum::actingAs($this->admin());
        $inRange = $this->makeExpense('2026-09-10');
        $outOfRange = $this->makeExpense('2026-09-16');

        $response = $this->getJson('/api/expenses?date_from=2026-09-01&date_to=2026-09-14');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($inRange->id, $ids);
        $this->assertNotContains($outOfRange->id, $ids);
    }

    public function test_expenses_index_search_by_description(): void
    {
        Sanctum::actingAs($this->admin());
        $match = Expense::create([
            'category' => 'Supplies',
            'amount' => 250,
            'description' => 'Purchased shampoo bottles',
            'date' => '2026-09-10',
            'created_by' => $this->admin()->id,
        ]);
        $other = $this->makeExpense('2026-09-11');

        $response = $this->getJson('/api/expenses?search=shampoo');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_expenses_index_search_by_category(): void
    {
        Sanctum::actingAs($this->admin());
        $match = Expense::create([
            'category' => 'maintenance',
            'amount' => 1200,
            'description' => 'AC repair',
            'date' => '2026-09-10',
            'created_by' => $this->admin()->id,
        ]);
        $other = $this->makeExpense('2026-09-11');

        $response = $this->getJson('/api/expenses?search=maintenance');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($match->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_expenses_summary_returns_totals_and_this_month(): void
    {
        Sanctum::actingAs($this->admin());
        Expense::create([
            'category' => 'Supplies',
            'amount' => 1000,
            'description' => 'Soap',
            'date' => now()->toDateString(),
            'created_by' => $this->admin()->id,
        ]);
        Expense::create([
            'category' => 'Utilities',
            'amount' => 1500,
            'description' => 'Water',
            'date' => now()->toDateString(),
            'created_by' => $this->admin()->id,
        ]);

        $response = $this->getJson('/api/expenses/summary');

        $response->assertOk();
        $this->assertEquals(2500, $response->json('total_amount'));
        $this->assertEquals(2, $response->json('count'));
        $this->assertEquals(1250, $response->json('average'));
        $this->assertEquals(2500, $response->json('this_month_amount'));
    }

    public function test_expenses_summary_respects_category_filter(): void
    {
        Sanctum::actingAs($this->admin());
        Expense::create([
            'category' => 'Supplies',
            'amount' => 1000,
            'description' => 'Soap',
            'date' => now()->toDateString(),
            'created_by' => $this->admin()->id,
        ]);
        Expense::create([
            'category' => 'Utilities',
            'amount' => 1500,
            'description' => 'Water',
            'date' => now()->toDateString(),
            'created_by' => $this->admin()->id,
        ]);

        $response = $this->getJson('/api/expenses/summary?category=Supplies');

        $response->assertOk();
        $this->assertEquals(1000, $response->json('total_amount'));
        $this->assertEquals(1, $response->json('count'));
        $this->assertEquals(1000, $response->json('average'));
    }

    public function test_invoices_index_filters_by_date_range(): void
    {
        Sanctum::actingAs($this->admin());
        $reservation = $this->makeReservation();
        $inRange = $this->makeInvoice($reservation, '2026-09-10');
        $outOfRange = $this->makeInvoice($reservation, '2026-09-16');

        $response = $this->getJson('/api/invoices?date_from=2026-09-01&date_to=2026-09-14');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($inRange->id, $ids);
        $this->assertNotContains($outOfRange->id, $ids);
    }
}
