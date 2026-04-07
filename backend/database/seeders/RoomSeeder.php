<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run()
    {
        Room::query()->delete();
        for ($f = 1; $f <= 9; $f++) {
            for ($d = 1; $d <= 10; $d++) {
                Room::create([
                    'number' => $f * 100 + $d,
                    'floor' => $f,
                    'position' => $d - 1,
                    'occupied' => false,
                ]);
            }
        }
        for ($d = 1; $d <= 7; $d++) {
            Room::create([
                'number' => 1000 + $d,
                'floor' => 10,
                'position' => $d - 1,
                'occupied' => false,
            ]);
        }
    }
}
