<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShiftController extends Controller
{
    public function index()
    {
        return response()->json(
            Shift::withCount(['employees', 'interns'])
                ->orderByRaw("FIELD(name, 'Matin', 'Soir', 'Nuit') ASC")
                ->orderBy('start_time')
                ->get()
                ->map(fn (Shift $shift) => $this->formatShift($shift))
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
        ]);

        $this->validateShiftWindow($validated['start_time'], $validated['end_time']);
        $this->ensureNoOverlap($validated['start_time'], $validated['end_time']);

        $shift = Shift::create([
            'name' => $validated['name'],
            'start_time' => Carbon::createFromFormat('H:i', $validated['start_time'])->format('H:i:s'),
            'end_time' => Carbon::createFromFormat('H:i', $validated['end_time'])->format('H:i:s'),
        ]);

        return response()->json($this->formatShift($shift->loadCount(['employees', 'interns'])), 201);
    }

    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
        ]);

        $this->validateShiftWindow($validated['start_time'], $validated['end_time']);
        $this->ensureNoOverlap($validated['start_time'], $validated['end_time'], $shift->id);

        $shift->update([
            'name' => $validated['name'],
            'start_time' => Carbon::createFromFormat('H:i', $validated['start_time'])->format('H:i:s'),
            'end_time' => Carbon::createFromFormat('H:i', $validated['end_time'])->format('H:i:s'),
        ]);

        return response()->json($this->formatShift($shift->fresh()->loadCount(['employees', 'interns'])));
    }

    public function destroy(Shift $shift)
    {
        $shift->loadCount(['employees', 'interns']);

        if ($shift->employees_count > 0 || $shift->interns_count > 0) {
            throw ValidationException::withMessages([
                'shift' => 'Impossible de supprimer un shift déjà assigné.',
            ]);
        }

        $shift->delete();

        return response()->json(['message' => 'Shift supprimé avec succès.']);
    }

    private function validateShiftWindow(string $startTime, string $endTime): void
    {
        if ($startTime === $endTime) {
            throw ValidationException::withMessages([
                'end_time' => 'L\'heure de fin doit être différente de l\'heure de début.',
            ]);
        }
    }

    private function ensureNoOverlap(string $startTime, string $endTime, ?int $ignoreId = null): void
    {
        $existingShifts = Shift::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->get();

        foreach ($existingShifts as $existingShift) {
            if ($this->rangesOverlap($startTime, $endTime, $existingShift->start_time, $existingShift->end_time)) {
                throw ValidationException::withMessages([
                    'start_time' => 'Les horaires se chevauchent avec un autre shift.',
                    'end_time' => 'Les horaires se chevauchent avec un autre shift.',
                ]);
            }
        }
    }

    private function rangesOverlap(string $startA, string $endA, string $startB, string $endB): bool
    {
        $segmentsA = $this->expandRange($startA, $endA);
        $segmentsB = $this->expandRange($startB, $endB);

        foreach ($segmentsA as [$aStart, $aEnd]) {
            foreach ($segmentsB as [$bStart, $bEnd]) {
                if ($aStart < $bEnd && $bStart < $aEnd) {
                    return true;
                }
            }
        }

        return false;
    }

    private function expandRange(string $start, string $end): array
    {
        $startMinutes = $this->toMinutes($start);
        $endMinutes = $this->toMinutes($end);

        if ($endMinutes > $startMinutes) {
            return [[$startMinutes, $endMinutes]];
        }

        return [
            [$startMinutes, 1440],
            [0, $endMinutes],
        ];
    }

    private function toMinutes(string $time): int
    {
        [$hours, $minutes] = explode(':', substr($time, 0, 5));

        return ((int) $hours * 60) + (int) $minutes;
    }

    private function formatShift(Shift $shift): array
    {
        return [
            'id' => $shift->id,
            'name' => $shift->name,
            'start_time' => substr($shift->start_time, 0, 5),
            'end_time' => substr($shift->end_time, 0, 5),
            'employees_count' => $shift->employees_count ?? 0,
            'interns_count' => $shift->interns_count ?? 0,
            'total_assigned' => ($shift->employees_count ?? 0) + ($shift->interns_count ?? 0),
        ];
    }
}