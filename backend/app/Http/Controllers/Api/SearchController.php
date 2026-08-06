<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = [];

        // Guests
        $guests = Guest::where(function ($q) use ($query) {
            $q->where('first_name', 'like', "%{$query}%")
              ->orWhere('last_name', 'like', "%{$query}%")
              ->orWhere('email', 'like', "%{$query}%")
              ->orWhere('phone', 'like', "%{$query}%");
        })->limit(5)->get(['id', 'first_name', 'last_name', 'email', 'phone']);

        foreach ($guests as $guest) {
            $results[] = [
                'type' => 'guest',
                'id' => $guest->id,
                'title' => $guest->first_name . ' ' . $guest->last_name,
                'subtitle' => $guest->email . ($guest->phone ? ' · ' . $guest->phone : ''),
                'badge' => null,
                'route' => '/admin/guests',
            ];
        }

        // Reservations
        $reservations = Reservation::with('guest')
            ->where(function ($q) use ($query) {
                $q->where('reservation_number', 'like', "%{$query}%")
                  ->orWhereHas('guest', function ($gq) use ($query) {
                      $gq->where('first_name', 'like', "%{$query}%")
                         ->orWhere('last_name', 'like', "%{$query}%");
                  });
            })->limit(5)->get(['id', 'reservation_number', 'guest_id', 'status']);

        foreach ($reservations as $reservation) {
            $results[] = [
                'type' => 'reservation',
                'id' => $reservation->id,
                'title' => $reservation->reservation_number,
                'subtitle' => $reservation->guest ? $reservation->guest->first_name . ' ' . $reservation->guest->last_name : 'Guest #' . $reservation->guest_id,
                'badge' => str_replace('_', ' ', $reservation->status),
                'route' => '/admin/reservations',
            ];
        }

        // Rooms
        $rooms = Room::with('roomType')
            ->where(function ($q) use ($query) {
                $q->where('room_number', 'like', "%{$query}%")
                  ->orWhereHas('roomType', function ($rtq) use ($query) {
                      $rtq->where('name', 'like', "%{$query}%");
                  });
            })->limit(5)->get(['id', 'room_number', 'status', 'room_type_id']);

        foreach ($rooms as $room) {
            $results[] = [
                'type' => 'room',
                'id' => $room->id,
                'title' => 'Room ' . $room->room_number,
                'subtitle' => $room->roomType ? $room->roomType->name : '',
                'badge' => $room->status,
                'route' => '/admin/rooms',
            ];
        }

        // Room Types
        $roomTypes = RoomType::where('name', 'like', "%{$query}%")
            ->limit(3)->get(['id', 'name', 'base_price']);

        foreach ($roomTypes as $rt) {
            $results[] = [
                'type' => 'room_type',
                'id' => $rt->id,
                'title' => $rt->name,
                'subtitle' => '₱' . number_format($rt->base_price, 2) . '/night',
                'badge' => null,
                'route' => '/admin/rooms',
            ];
        }

        return response()->json(['results' => $results]);
    }
}
