<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Services\RoomBookingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HotelController extends Controller
{
    private RoomBookingService $booking;

    public function __construct(RoomBookingService $booking)
    {
        $this->booking = $booking;
    }

    public function state()
    {
        $rooms = Room::query()->orderBy('number')->get()->map(function (Room $r) {
            return [
                'id' => $r->id,
                'number' => $r->number,
                'floor' => $r->floor,
                'position' => $r->position,
                'occupied' => $r->occupied,
                'user_id' => $r->user_id,
            ];
        });

        return response()->json(['rooms' => $rooms]);
    }

    public function book(Request $request)
    {
        $data = $request->validate([
            'count' => 'required|integer|min:1|max:5',
        ]);
        $userId = $request->user()->id;
        $alreadyBooked = Room::query()
            ->where('occupied', true)
            ->where('user_id', $userId)
            ->count();
        $remaining = max(0, 5 - $alreadyBooked);
        if ($remaining === 0) {
            return response()->json(['message' => 'You already have 5 active bookings.'], 422);
        }
        $k = min((int) $data['count'], $remaining);
        $available = Room::query()->where('occupied', false)->orderBy('number')->get()->map(function (Room $r) {
            return [
                'id' => $r->id,
                'number' => $r->number,
                'floor' => $r->floor,
                'position' => $r->position,
            ];
        })->values()->all();
        $best = $this->booking->chooseBest($available, $k);
        if ($best === null) {
            return response()->json(['message' => 'Not enough rooms available.'], 422);
        }
        $minutes = $this->booking->pathMinutes($best);
        DB::transaction(function () use ($best, $userId) {
            foreach ($best as $slot) {
                Room::query()
                    ->where('id', $slot['id'])
                    ->update(['occupied' => true, 'user_id' => $userId]);
            }
        });

        return response()->json([
            'booked' => array_map(function ($r) {
                return [
                    'number' => $r['number'],
                    'floor' => $r['floor'],
                    'position' => $r['position'],
                ];
            }, $best),
            'travel_minutes' => $minutes,
        ]);
    }

    public function bookExact(Request $request)
    {
        $data = $request->validate([
            'numbers' => 'required|array|min:1|max:5',
            'numbers.*' => 'integer',
        ]);

        $userId = $request->user()->id;
        $alreadyBooked = Room::query()
            ->where('occupied', true)
            ->where('user_id', $userId)
            ->count();
        $remaining = max(0, 5 - $alreadyBooked);
        if ($remaining === 0) {
            return response()->json(['message' => 'You already have 5 active bookings.'], 422);
        }

        $numbers = array_values(array_unique($data['numbers']));
        if (count($numbers) === 0) {
            return response()->json(['message' => 'No rooms requested.'], 422);
        }
        if (count($numbers) > $remaining) {
            return response()->json(['message' => 'You can only book '.$remaining.' more room(s).'], 422);
        }

        $rooms = Room::query()
            ->whereIn('number', $numbers)
            ->where('occupied', false)
            ->get()
            ->map(function (Room $r) {
                return [
                    'id' => $r->id,
                    'number' => $r->number,
                    'floor' => $r->floor,
                    'position' => $r->position,
                ];
            })
            ->values()
            ->all();

        if (count($rooms) !== count($numbers)) {
            return response()->json(['message' => 'One or more rooms are no longer available.'], 422);
        }

        $minutes = $this->booking->pathMinutes($rooms);

        DB::transaction(function () use ($rooms, $userId) {
            foreach ($rooms as $slot) {
                Room::query()
                    ->where('id', $slot['id'])
                    ->update(['occupied' => true, 'user_id' => $userId]);
            }
        });

        return response()->json([
            'booked' => array_map(function ($r) {
                return [
                    'number' => $r['number'],
                    'floor' => $r['floor'],
                    'position' => $r['position'],
                ];
            }, $rooms),
            'travel_minutes' => $minutes,
        ]);
    }

    public function randomOccupancy(Request $request)
    {
        $data = $request->validate([
            'density' => 'sometimes|numeric|min:0.35|max:0.92',
        ]);
        $density = isset($data['density']) ? (float) $data['density'] : (mt_rand(45, 82) / 100);
        $ids = Room::query()->pluck('id')->shuffle()->values()->all();
        $take = (int) round(count($ids) * $density);
        $take = max(1, min(count($ids) - 1, $take));
        Room::query()->update(['occupied' => false, 'user_id' => null]);
        foreach (array_slice($ids, 0, $take) as $id) {
            Room::query()->where('id', $id)->update(['occupied' => true, 'user_id' => null]);
        }

        return response()->json(['occupied_count' => $take]);
    }

    public function reset()
    {
        Room::query()->update(['occupied' => false, 'user_id' => null]);

        return response()->json(['ok' => true]);
    }
}
