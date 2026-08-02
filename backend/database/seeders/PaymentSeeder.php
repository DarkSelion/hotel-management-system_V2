<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $reservations = Reservation::all()->keyBy('id');

        $payments = [
            [
                'reservation_id' => 1, 'guest_id' => 1,
                'amount' => 825.00, 'payment_method' => 'gcash',
                'payment_type' => 'full', 'status' => 'completed',
                'transaction_id' => 'TXN-' . mt_rand(100000, 999999),
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Full payment at check-in', 'processed_by' => 3,
                'paid_at' => Carbon::now()->subDays(2),
            ],
            [
                'reservation_id' => 2, 'guest_id' => 2,
                'amount' => 500.00, 'payment_method' => 'gcash',
                'payment_type' => 'deposit', 'status' => 'completed',
                'transaction_id' => 'TXN-' . mt_rand(100000, 999999),
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Deposit payment', 'processed_by' => 3,
                'paid_at' => Carbon::now()->subDays(1),
            ],
            [
                'reservation_id' => 3, 'guest_id' => 3,
                'amount' => 1925.00, 'payment_method' => 'gcash',
                'payment_type' => 'full', 'status' => 'completed',
                'transaction_id' => 'GCASH-' . mt_rand(100000, 999999),
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Online payment via GCash', 'processed_by' => 5,
                'paid_at' => Carbon::now()->subDays(3),
            ],
            [
                'reservation_id' => 4, 'guest_id' => 4,
                'amount' => 200.00, 'payment_method' => 'cash',
                'payment_type' => 'deposit', 'status' => 'completed',
                'transaction_id' => null,
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Cash deposit', 'processed_by' => 5,
                'paid_at' => Carbon::now(),
            ],
            [
                'reservation_id' => 6, 'guest_id' => 6,
                'amount' => 1097.25, 'payment_method' => 'gcash',
                'payment_type' => 'full', 'status' => 'completed',
                'transaction_id' => 'BT-' . mt_rand(100000, 999999),
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Bank transfer full payment', 'processed_by' => 5,
                'paid_at' => Carbon::now(),
            ],
            [
                'reservation_id' => 10, 'guest_id' => 10,
                'amount' => 495.00, 'payment_method' => 'gcash',
                'payment_type' => 'full', 'status' => 'completed',
                'transaction_id' => 'TXN-' . mt_rand(100000, 999999),
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Card payment at check-out', 'processed_by' => 5,
                'paid_at' => Carbon::now()->subDays(7),
            ],
            [
                'reservation_id' => 11, 'guest_id' => 11,
                'amount' => 935.00, 'payment_method' => 'gcash',
                'payment_type' => 'full', 'status' => 'completed',
                'transaction_id' => 'GCASH-' . mt_rand(100000, 999999),
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'GCash payment', 'processed_by' => 5,
                'paid_at' => Carbon::now()->subDays(4),
            ],
            [
                'reservation_id' => 12, 'guest_id' => 12,
                'amount' => 2750.00, 'payment_method' => 'gcash',
                'payment_type' => 'full', 'status' => 'completed',
                'transaction_id' => 'BT-' . mt_rand(100000, 999999),
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Corporate bank transfer', 'processed_by' => 5,
                'paid_at' => Carbon::now()->subDays(9),
            ],
            [
                'reservation_id' => 1, 'guest_id' => 1,
                'amount' => 200.00, 'payment_method' => 'cash',
                'payment_type' => 'partial', 'status' => 'completed',
                'transaction_id' => null,
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Incidental deposit', 'processed_by' => 3,
                'paid_at' => Carbon::now()->subDays(2),
            ],
            [
                'reservation_id' => 4, 'guest_id' => 4,
                'amount' => 295.00, 'payment_method' => 'gcash',
                'payment_type' => 'partial', 'status' => 'pending',
                'transaction_id' => null,
                'reference_number' => 'REF-' . strtoupper(substr(md5(rand()), 0, 8)),
                'notes' => 'Balance payment pending', 'processed_by' => null,
                'paid_at' => null,
            ],
        ];

        foreach ($payments as $data) {
            Payment::create($data);
        }
    }
}
