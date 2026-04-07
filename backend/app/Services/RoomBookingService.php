<?php

namespace App\Services;

class RoomBookingService
{
    public function pathMinutes(array $rooms): float
    {
        if (count($rooms) <= 1) {
            return 0;
        }
        usort($rooms, function ($a, $b) {
            if ($a['floor'] !== $b['floor']) {
                return $a['floor'] <=> $b['floor'];
            }

            return $a['position'] <=> $b['position'];
        });
        $sum = 0.0;
        for ($i = 0; $i < count($rooms) - 1; $i++) {
            $sum += $this->legMinutes($rooms[$i], $rooms[$i + 1]);
        }

        return $sum;
    }

    public function legMinutes(array $a, array $b): float
    {
        if ($a['floor'] === $b['floor']) {
            return abs($a['position'] - $b['position']);
        }

        return $a['position'] + 2 * abs($a['floor'] - $b['floor']) + $b['position'];
    }

    public function windowsOnFloor(array $floorRooms, int $size): array
    {
        if ($size < 1 || count($floorRooms) < $size) {
            return [];
        }
        usort($floorRooms, function ($x, $y) {
            return $x['position'] <=> $y['position'];
        });
        $out = [];
        $n = count($floorRooms);
        for ($s = 0; $s <= $n - $size; $s++) {
            $slice = array_slice($floorRooms, $s, $size);

            $out[] = $slice;
        }

        return $out;
    }

    public function compositions(int $sum, int $parts): array
    {
        if ($parts === 1) {
            return [[$sum]];
        }
        $res = [];
        for ($first = 1; $first <= $sum - $parts + 1; $first++) {
            foreach ($this->compositions($sum - $first, $parts - 1) as $rest) {
                $res[] = array_merge([$first], $rest);
            }
        }

        return $res;
    }

    public function floorIndices(array $byFloor): array
    {
        return array_keys($byFloor);
    }

    public function chooseBest(array $availableRooms, int $k): ?array
    {
        if ($k < 1 || $k > 5) {
            return null;
        }
        if (count($availableRooms) < $k) {
            return null;
        }
        $byFloor = [];
        foreach ($availableRooms as $r) {
            $f = $r['floor'];
            if (! isset($byFloor[$f])) {
                $byFloor[$f] = [];
            }
            $byFloor[$f][] = $r;
        }
        ksort($byFloor);
        $best = null;
        $bestScore = INF;
        $floors = array_keys($byFloor);
        for ($m = 1; $m <= min($k, count($floors)); $m++) {
            foreach ($this->compositions($k, $m) as $comp) {
                foreach ($this->floorTuples($floors, $m) as $tuple) {
                    $ok = true;
                    $choices = [];
                    foreach ($tuple as $ti => $fl) {
                        $need = $comp[$ti];
                        if (! isset($byFloor[$fl]) || count($byFloor[$fl]) < $need) {
                            $ok = false;
                            break;
                        }
                        $wins = $this->windowsOnFloor($byFloor[$fl], $need);
                        if (count($wins) === 0) {
                            $ok = false;
                            break;
                        }
                        $choices[] = $wins;
                    }
                    if (! $ok) {
                        continue;
                    }
                    foreach ($this->cartesian($choices) as $picked) {
                        $merged = [];
                        foreach ($picked as $chunk) {
                            foreach ($chunk as $room) {
                                $merged[] = $room;
                            }
                        }
                        $score = $this->pathMinutes($merged);
                        if ($score < $bestScore) {
                            $bestScore = $score;
                            $best = $merged;
                        }
                    }
                }
            }
        }

        return $best;
    }

    private function floorTuples(array $floors, int $m): array
    {
        sort($floors);
        return $this->combinationsOf($floors, $m);
    }

    private function combinationsOf(array $items, int $m): array
    {
        $n = count($items);
        if ($m > $n || $m < 1) {
            return [];
        }
        if ($m === $n) {
            return [$items];
        }
        if ($m === 1) {
            return array_map(function ($x) {
                return [$x];
            }, $items);
        }
        $res = [];
        for ($i = 0; $i <= $n - $m; $i++) {
            $head = $items[$i];
            foreach ($this->combinationsOf(array_slice($items, $i + 1), $m - 1) as $tail) {
                array_unshift($tail, $head);
                $res[] = $tail;
            }
        }

        return $res;
    }

    private function cartesian(array $arrays): array
    {
        if (count($arrays) === 0) {
            return [[]];
        }
        $head = array_shift($arrays);
        $rest = $this->cartesian($arrays);
        $out = [];
        foreach ($head as $h) {
            foreach ($rest as $r) {
                $out[] = array_merge([$h], $r);
            }
        }

        return $out;
    }
}
