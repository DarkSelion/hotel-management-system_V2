<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function revenue(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'group_by' => 'sometimes|in:day,week,month',
        ]);

        $groupBy = $data['group_by'] ?? 'day';

        $dateFormat = match ($groupBy) {
            'week' => DB::raw("YEARWEEK(created_at, 1) as period"),
            'month' => DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
            default => DB::raw("DATE(created_at) as period"),
        };

        $results = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$data['from'], $data['to'] . ' 23:59:59'])
            ->select($dateFormat, DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json($results);
    }

    public function occupancy(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        $totalRooms = Room::where('is_active', true)->count();
        $from = now()->parse($data['from'])->startOfDay();
        $to = now()->parse($data['to'])->endOfDay();
        $days = $from->diffInDays($to->copy()->startOfDay());

        $dates = collect(range(0, $days))->map(fn ($day) => $from->copy()->addDays($day)->format('Y-m-d'));

        $reservations = Reservation::select('check_in', 'check_out')
            ->whereIn('status', ['checked_in', 'confirmed'])
            ->where('check_in', '<=', $to->format('Y-m-d'))
            ->where('check_out', '>=', $from->format('Y-m-d'))
            ->get();

        $results = $dates->map(function ($date) use ($reservations, $totalRooms) {
            $occupied = $reservations->filter(fn ($r) => $r->check_in <= $date && $r->check_out > $date)->count();

            return [
                'date' => $date,
                'occupied' => $occupied,
                'available' => $totalRooms - $occupied,
                'rate' => $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 2) : 0,
            ];
        });

        return response()->json($results);
    }

    public function reservations(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        $total = Reservation::whereBetween('created_at', [$data['from'], $data['to'] . ' 23:59:59'])->count();

        $statusBreakdown = Reservation::whereBetween('created_at', [$data['from'], $data['to'] . ' 23:59:59'])
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->get();

        $daily = Reservation::whereBetween('created_at', [$data['from'], $data['to'] . ' 23:59:59'])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as total'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'total' => $total,
            'status_breakdown' => $statusBreakdown,
            'daily' => $daily,
        ]);
    }

    public function export(Request $request, string $type)
    {
        $allowed = ['revenue', 'occupancy', 'reservations'];
        if (!in_array($type, $allowed)) {
            return response()->json(['message' => 'Invalid report type.'], 422);
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $type . '-report.csv"',
        ];

        $from = $request->from ?? now()->subMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        $filename = storage_path('app/' . $type . '-report.csv');
        $handle = fopen($filename, 'w');

        switch ($type) {
            case 'revenue':
                fputcsv($handle, ['Date', 'Amount', 'Payment Method', 'Reservation']);
                Payment::with('reservation')
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$from, $to . ' 23:59:59'])
                    ->chunk(100, function ($payments) use ($handle) {
                        foreach ($payments as $p) {
                            fputcsv($handle, [
                                $p->created_at->format('Y-m-d'),
                                $p->amount,
                                $p->payment_method,
                                $p->reservation?->reservation_number,
                            ]);
                        }
                    });
                break;

            case 'occupancy':
                fputcsv($handle, ['Date', 'Occupied', 'Available', 'Rate (%)']);
                $totalRooms = Room::where('is_active', true)->count();
                $rangeStart = now()->parse($from)->startOfDay();
                $rangeEnd = now()->parse($to)->endOfDay();
                $days = $rangeStart->diffInDays($rangeEnd->copy()->startOfDay());
                $dates = collect(range(0, $days))->map(fn($d) => $rangeStart->copy()->addDays($d)->format('Y-m-d'));

                $reservations = Reservation::select('check_in', 'check_out')
                    ->whereIn('status', ['checked_in', 'confirmed'])
                    ->where('check_in', '<=', $rangeEnd->format('Y-m-d'))
                    ->where('check_out', '>=', $rangeStart->format('Y-m-d'))
                    ->get();

                foreach ($dates as $date) {
                    $occupied = $reservations->filter(fn ($r) => $r->check_in <= $date && $r->check_out > $date)->count();
                    fputcsv($handle, [$date, $occupied, $totalRooms - $occupied, $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 2) : 0]);
                }
                break;

            case 'reservations':
                fputcsv($handle, ['ID', 'Number', 'Guest', 'Room', 'Check In', 'Check Out', 'Status', 'Total', 'Created']);
                Reservation::with('guest', 'room')
                    ->whereBetween('created_at', [$from, $to . ' 23:59:59'])
                    ->chunk(100, function ($reservations) use ($handle) {
                        foreach ($reservations as $r) {
                            fputcsv($handle, [
                                $r->id,
                                $r->reservation_number,
                                ($r->guest->first_name ?? '') . ' ' . ($r->guest->last_name ?? ''),
                                $r->room?->room_number,
                                $r->check_in,
                                $r->check_out,
                                $r->status,
                                $r->total_amount,
                                $r->created_at->format('Y-m-d'),
                            ]);
                        }
                    });
                break;

        }

        fclose($handle);

        return response()->download($filename, basename($filename), $headers)->deleteFileAfterSend(true);
    }
}
