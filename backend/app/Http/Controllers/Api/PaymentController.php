<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['reservation.guest']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('reservation.guest', function ($gq) use ($search) {
                        $gq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($method = $request->payment_method) {
            $query->where('payment_method', $method);
        }

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        if ($from = $request->date_from) {
            $query->where('created_at', '>=', $from . ' 00:00:00');
        }

        if ($to = $request->date_to) {
            $query->where('created_at', '<=', $to . ' 23:59:59');
        }

        $sort = $request->sort ?? '-created_at';
        $dir = $sort[0] === '-' ? 'desc' : 'asc';
        $field = ltrim($sort, '-');
        $allowed = ['created_at', 'amount', 'status', 'payment_method', 'reference_number'];
        if (in_array($field, $allowed)) {
            $query->orderBy($field, $dir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return response()->json(
            $query->paginate($request->per_page ?? 10)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'reservation_id' => 'required|exists:reservations,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,gcash',
            'payment_type' => 'required|in:full,partial,deposit,refund',
            'status' => 'sometimes|in:pending,completed,failed,refunded',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $payment = DB::transaction(function () use ($data, $request) {
            $reservation = Reservation::findOrFail($data['reservation_id']);

            $data['guest_id'] = $reservation->guest_id;
            $data['paid_at'] = now();

            if (!isset($data['status'])) {
                $data['status'] = 'completed';
            }

            $payment = Payment::create($data);

            $paidAmount = $reservation->payments()
                ->where('status', 'completed')
                ->sum('amount');

            $reservation->update([
                'paid_amount' => $paidAmount,
                'payment_status' => $paidAmount >= $reservation->total_amount ? 'paid' : 'partial',
                'due_amount' => max(0, $reservation->total_amount - $paidAmount),
            ]);

            return $payment;
        });

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'created',
            'module' => 'payments',
            'model_type' => 'Payment',
            'model_id' => $payment->id,
            'description' => "Recorded payment of ₱" . number_format($payment->amount, 2) . " for reservation #" . $payment->reservation->reservation_number,
        ]);

        return response()->json($payment->load('reservation.guest'), 201);
    }

    public function show(Payment $payment)
    {
        return response()->json($payment->load(['reservation.guest']));
    }

    public function update(Request $request, Payment $payment)
    {
        $data = $request->validate([
            'payment_method' => 'sometimes|in:cash,gcash',
            'status' => 'sometimes|in:pending,completed,failed,refunded',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $payment->update($data);

        if (in_array('status', array_keys($data))) {
            $reservation = $payment->reservation;
            $paidAmount = $reservation->payments()
                ->where('status', 'completed')
                ->sum('amount');

            $reservation->update([
                'paid_amount' => $paidAmount,
                'payment_status' => $paidAmount >= $reservation->total_amount ? 'paid' : 'partial',
                'due_amount' => max(0, $reservation->total_amount - $paidAmount),
            ]);
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'module' => 'payments',
            'model_type' => 'Payment',
            'model_id' => $payment->id,
            'description' => "Updated payment #{$payment->id} status to {$payment->status}",
        ]);

        return response()->json($payment->load('reservation.guest'));
    }

    public function destroy(Payment $payment)
    {
        return response()->json(['message' => 'Payments cannot be deleted. Use refund instead.'], 422);
    }
}
