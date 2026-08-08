<?php

namespace Database\Seeders;

use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ReservationSeeder extends Seeder
{
    protected int $counter = 1;

    protected function nextReservationNumber(): string
    {
        return 'BK-' . now()->year . '-' . str_pad((string) ($this->counter++), 4, '0', STR_PAD_LEFT);
    }

    public function run(): void
    {
        $rooms = Room::all()->keyBy('room_number');
        $guests = Guest::whereIn('id', range(1, 15))->get();

        $reservations = [
            // 3 checked_in (active)
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 1, 'room_id' => $rooms['101']->id, 'status' => 'checked_in',
                'check_in' => Carbon::now()->subDays(2), 'check_out' => Carbon::now()->addDays(3),
                'adults' => 2, 'children' => 0,
                'price_per_night' => 150.00, 'total_nights' => 5,
                'subtotal' => 750.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 75.00, 'total_amount' => 825.00,
                'paid_amount' => 825.00, 'due_amount' => 0, 'payment_status' => 'paid',
                'source' => 'direct', 'created_by' => 3,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 2, 'room_id' => $rooms['201']->id, 'status' => 'checked_in',
                'check_in' => Carbon::now()->subDays(1), 'check_out' => Carbon::now()->addDays(4),
                'adults' => 2, 'children' => 1,
                'price_per_night' => 250.00, 'total_nights' => 5,
                'subtotal' => 1250.00, 'discount_percent' => 10, 'discount_amount' => 125.00,
                'tax_percent' => 10, 'tax_amount' => 112.50, 'total_amount' => 1237.50,
                'paid_amount' => 500.00, 'due_amount' => 737.50, 'payment_status' => 'partial',
                'source' => 'booking_engine', 'created_by' => 4,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 3, 'room_id' => $rooms['209']->id, 'status' => 'checked_in',
                'check_in' => Carbon::now()->subDays(3), 'check_out' => Carbon::now()->addDays(2),
                'adults' => 2, 'children' => 0,
                'price_per_night' => 350.00, 'total_nights' => 5,
                'subtotal' => 1750.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 175.00, 'total_amount' => 1925.00,
                'paid_amount' => 1925.00, 'due_amount' => 0, 'payment_status' => 'paid',
                'source' => 'direct', 'created_by' => 3,
            ],
            // 3 confirmed (upcoming)
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 4, 'room_id' => $rooms['102']->id, 'status' => 'confirmed',
                'check_in' => Carbon::now()->addDays(7), 'check_out' => Carbon::now()->addDays(10),
                'adults' => 2, 'children' => 0,
                'price_per_night' => 150.00, 'total_nights' => 3,
                'subtotal' => 450.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 45.00, 'total_amount' => 495.00,
                'paid_amount' => 200.00, 'due_amount' => 295.00, 'payment_status' => 'partial',
                'source' => 'booking_engine', 'created_by' => 3,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 5, 'room_id' => $rooms['202']->id, 'status' => 'confirmed',
                'check_in' => Carbon::now()->addDays(14), 'check_out' => Carbon::now()->addDays(18),
                'adults' => 3, 'children' => 0,
                'price_per_night' => 250.00, 'total_nights' => 4,
                'subtotal' => 1000.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 100.00, 'total_amount' => 1100.00,
                'paid_amount' => 0, 'due_amount' => 1100.00, 'payment_status' => 'unpaid',
                'source' => 'online_travel_agency', 'created_by' => 4,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 6, 'room_id' => $rooms['301']->id, 'status' => 'confirmed',
                'check_in' => Carbon::now()->addDays(5), 'check_out' => Carbon::now()->addDays(8),
                'adults' => 2, 'children' => 1,
                'price_per_night' => 350.00, 'total_nights' => 3,
                'subtotal' => 1050.00, 'discount_percent' => 5, 'discount_amount' => 52.50,
                'tax_percent' => 10, 'tax_amount' => 99.75, 'total_amount' => 1097.25,
                'paid_amount' => 1097.25, 'due_amount' => 0, 'payment_status' => 'paid',
                'source' => 'direct', 'created_by' => 3,
            ],
            // 3 pending
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 7, 'room_id' => $rooms['103']->id, 'status' => 'pending',
                'check_in' => Carbon::now()->addDays(10), 'check_out' => Carbon::now()->addDays(13),
                'adults' => 1, 'children' => 0,
                'price_per_night' => 150.00, 'total_nights' => 3,
                'subtotal' => 450.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 45.00, 'total_amount' => 495.00,
                'paid_amount' => 0, 'due_amount' => 495.00, 'payment_status' => 'unpaid',
                'source' => 'booking_engine', 'created_by' => 5,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 8, 'room_id' => $rooms['204']->id, 'status' => 'pending',
                'check_in' => Carbon::now()->addDays(21), 'check_out' => Carbon::now()->addDays(25),
                'adults' => 2, 'children' => 0,
                'price_per_night' => 250.00, 'total_nights' => 4,
                'subtotal' => 1000.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 100.00, 'total_amount' => 1100.00,
                'paid_amount' => 0, 'due_amount' => 1100.00, 'payment_status' => 'unpaid',
                'source' => 'phone', 'created_by' => 4,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 9, 'room_id' => $rooms['305']->id, 'status' => 'pending',
                'check_in' => Carbon::now()->addDays(30), 'check_out' => Carbon::now()->addDays(35),
                'adults' => 3, 'children' => 1,
                'price_per_night' => 500.00, 'total_nights' => 5,
                'subtotal' => 2500.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 250.00, 'total_amount' => 2750.00,
                'paid_amount' => 0, 'due_amount' => 2750.00, 'payment_status' => 'unpaid',
                'source' => 'online_travel_agency', 'created_by' => 5,
            ],
            // 3 completed (checked_out)
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 10, 'room_id' => $rooms['105']->id, 'status' => 'checked_out',
                'check_in' => Carbon::now()->subDays(10), 'check_out' => Carbon::now()->subDays(7),
                'adults' => 2, 'children' => 0,
                'price_per_night' => 150.00, 'total_nights' => 3,
                'subtotal' => 450.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 45.00, 'total_amount' => 495.00,
                'paid_amount' => 495.00, 'due_amount' => 0, 'payment_status' => 'paid',
                'source' => 'direct', 'created_by' => 3,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 11, 'room_id' => $rooms['205']->id, 'status' => 'checked_out',
                'check_in' => Carbon::now()->subDays(8), 'check_out' => Carbon::now()->subDays(4),
                'adults' => 2, 'children' => 0,
                'price_per_night' => 250.00, 'total_nights' => 4,
                'subtotal' => 1000.00, 'discount_percent' => 15, 'discount_amount' => 150.00,
                'tax_percent' => 10, 'tax_amount' => 85.00, 'total_amount' => 935.00,
                'paid_amount' => 935.00, 'due_amount' => 0, 'payment_status' => 'paid',
                'source' => 'booking_engine', 'created_by' => 4,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 12, 'room_id' => $rooms['305']->id, 'status' => 'checked_out',
                'check_in' => Carbon::now()->subDays(14), 'check_out' => Carbon::now()->subDays(9),
                'adults' => 3, 'children' => 0,
                'price_per_night' => 500.00, 'total_nights' => 5,
                'subtotal' => 2500.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 250.00, 'total_amount' => 2750.00,
                'paid_amount' => 2750.00, 'due_amount' => 0, 'payment_status' => 'paid',
                'source' => 'corporate', 'created_by' => 3,
            ],
            // 2 cancelled
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 13, 'room_id' => $rooms['107']->id, 'status' => 'cancelled',
                'check_in' => Carbon::now()->subDays(20), 'check_out' => Carbon::now()->subDays(17),
                'adults' => 2, 'children' => 0,
                'price_per_night' => 150.00, 'total_nights' => 3,
                'subtotal' => 450.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 0, 'total_amount' => 0,
                'paid_amount' => 0, 'due_amount' => 0, 'payment_status' => 'cancelled',
                'source' => 'phone', 'created_by' => 3,
            ],
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 14, 'room_id' => $rooms['208']->id, 'status' => 'cancelled',
                'check_in' => Carbon::now()->subDays(30), 'check_out' => Carbon::now()->subDays(27),
                'adults' => 1, 'children' => 0,
                'price_per_night' => 250.00, 'total_nights' => 3,
                'subtotal' => 750.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 0, 'total_amount' => 0,
                'paid_amount' => 0, 'due_amount' => 0, 'payment_status' => 'cancelled',
                'source' => 'booking_engine', 'created_by' => 5,
            ],
            // 1 no_show
            [
                'reservation_number' => $this->nextReservationNumber(),
                'guest_id' => 15, 'room_id' => $rooms['109']->id, 'status' => 'no_show',
                'check_in' => Carbon::now()->subDays(5), 'check_out' => Carbon::now()->subDays(2),
                'adults' => 2, 'children' => 2,
                'price_per_night' => 200.00, 'total_nights' => 3,
                'subtotal' => 600.00, 'discount_percent' => 0, 'discount_amount' => 0,
                'tax_percent' => 10, 'tax_amount' => 60.00, 'total_amount' => 660.00,
                'paid_amount' => 0, 'due_amount' => 660.00, 'payment_status' => 'unpaid',
                'source' => 'direct', 'created_by' => 3,
            ],
        ];

        foreach ($reservations as $data) {
            Reservation::create($data);
        }
    }
}
