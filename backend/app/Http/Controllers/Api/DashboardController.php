<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();

        $todayRevenue = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->sum('amount');

        $totalRooms = Room::where('is_active', true)->count();
        $occupiedRooms = Room::where('status', 'occupied')->count();
        $availableRooms = Room::where('status', 'available')->count();
        $bookedRooms = Room::whereIn('status', ['occupied', 'reserved'])->count();

        $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 2) : 0;

        $today = now()->format('Y-m-d');

        $checkInsToday = Reservation::where('check_in', $today)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->count();

        $checkOutsToday = Reservation::where('check_out', $today)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->count();

        $pendingReservations = Reservation::where('status', 'pending')->count();

        return response()->json([
            'today_revenue' => $todayRevenue,
            'occupancy_rate' => $occupancyRate,
            'available_rooms' => $availableRooms,
            'booked_rooms' => $bookedRooms,
            'check_ins_today' => $checkInsToday,
            'check_outs_today' => $checkOutsToday,
            'pending_reservations' => $pendingReservations,
            'total_rooms' => $totalRooms,
        ]);
    }

    public function revenue()
    {
        $days = 30;

        $revenueData = Payment::where('status', 'completed')
            ->where('created_at', '>=', now()->subDays($days))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as revenue'))
            ->groupBy('date')
            ->pluck('revenue', 'date');

        $bookingData = Reservation::where('created_at', '>=', now()->subDays($days))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as bookings'))
            ->groupBy('date')
            ->pluck('bookings', 'date');

        $data = collect(range($days - 1, 0))->map(function ($daysAgo) use ($revenueData, $bookingData) {
            $date = now()->subDays($daysAgo)->format('Y-m-d');
            return [
                'date' => $date,
                'revenue' => $revenueData->get($date, 0),
                'bookings' => $bookingData->get($date, 0),
            ];
        })->values();

        return response()->json($data);
    }

    public function occupancy()
    {
        $totalRooms = Room::where('is_active', true)->count();

        $windowStart = now()->subDays(29)->startOfDay();
        $windowEnd = now()->endOfDay();
        $dates = collect(range(29, 0))->map(fn ($daysAgo) => now()->subDays($daysAgo)->format('Y-m-d'));

        $reservations = Reservation::select('check_in', 'check_out')
            ->where('status', 'in', ['checked_in', 'confirmed'])
            ->where('check_in', '<=', $windowEnd->format('Y-m-d'))
            ->where('check_out', '>=', $windowStart->format('Y-m-d'))
            ->get();

        $data = $dates->map(function ($date) use ($reservations, $totalRooms) {
            $occupied = $reservations->filter(fn ($r) => $r->check_in <= $date && $r->check_out > $date)->count();

            return [
                'date' => $date,
                'rate' => $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 2) : 0,
            ];
        });

        return response()->json($data);
    }

    public function bookingSources()
    {
        $data = Reservation::select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source')
            ->orderByDesc('count')
            ->get();

        return response()->json($data);
    }

    public function recentActivities()
    {
        $data = ActivityLog::with('user')
            ->latest()
            ->take(10)
            ->get();

        return response()->json($data);
    }

    public function topRoomTypes()
    {
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        $data = RoomType::select('room_types.id', 'room_types.name', DB::raw('COUNT(reservations.id) as total'))
            ->join('rooms', 'rooms.room_type_id', '=', 'room_types.id')
            ->join('reservations', 'reservations.room_id', '=', 'rooms.id')
            ->whereBetween('reservations.created_at', [$monthStart, $monthEnd])
            ->groupBy('room_types.id', 'room_types.name')
            ->orderByDesc('total')
            ->get();

        return response()->json($data);
    }
}
