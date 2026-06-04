<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Intern;
use App\Models\ScanLog;
use App\Models\FaceData;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    public function index()
    {
        $today = Carbon::today()->toDateString();

        $records = Attendance::with('user')
            ->where('date', $today)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($attendance) => $this->formatAttendance($attendance));

        return response()->json($records);
    }

    public function recognize(Request $request)
    {
        $validated = $request->validate([
            'descriptor' => 'required|string',
        ]);

        $descriptor = json_decode($validated['descriptor'], true);

        if (!is_array($descriptor) || count($descriptor) !== 128) {
            throw ValidationException::withMessages([
                'descriptor' => 'Le descripteur facial est invalide.',
            ]);
        }

        $descriptor = array_map('floatval', $descriptor);
        $bestMatch = null;
        $bestDistance = null;

        FaceData::with('user')->chunk(50, function ($faceDataBatch) use (&$bestMatch, &$bestDistance, $descriptor) {
            foreach ($faceDataBatch as $faceData) {
                foreach (($faceData->face_descriptors ?? []) as $storedDescriptor) {
                    if (!is_array($storedDescriptor) || count($storedDescriptor) !== count($descriptor)) {
                        continue;
                    }

                    $distance = $this->euclideanDistance($descriptor, array_map('floatval', $storedDescriptor));

                    if ($bestDistance === null || $distance < $bestDistance) {
                        $bestDistance = $distance;
                        $bestMatch = $faceData;
                    }
                }
            }
        });

        $threshold = 0.48;

        if (!$bestMatch || $bestDistance === null || $bestDistance > $threshold || !$bestMatch->user) {
            ScanLog::create([
                'user_identifier' => 'Inconnu',
                'accepted' => false,
                'rejection_reason' => 'Utilisateur inconnu',
                'scan_time' => now(),
            ]);

            return response()->json([
                'matched' => false,
                'message' => 'Visage non reconnu',
                'distance' => $bestDistance,
            ], 404);
        }

        $user = $bestMatch->user;
        $userType = class_basename($bestMatch->user_type);
        $userName = $user->full_name ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
        $now = now();

        if ($bestMatch->last_scan_time && Carbon::parse($bestMatch->last_scan_time)->diffInMinutes($now) < 15) {
            ScanLog::create([
                'user_identifier' => $userType . ' (' . $userName . ')',
                'accepted' => false,
                'rejection_reason' => 'Anti-spam: délai minimum de 15 minutes non respecté',
                'scan_time' => $now,
            ]);

            return response()->json([
                'matched' => false,
                'message' => 'Veuillez attendre 15 minutes avant un nouveau scan.',
                'distance' => $bestDistance,
            ], 429);
        }

        $bestMatch->update(['last_scan_time' => $now]);

        ScanLog::create([
            'user_identifier' => $userType . ' (' . $userName . ')',
            'accepted' => true,
            'rejection_reason' => null,
            'scan_time' => now(),
        ]);

        return response()->json([
            'matched' => true,
            'distance' => $bestDistance,
            'confidence' => round(max(0, 1 - $bestDistance) * 100, 2),
            'user' => [
                'id' => $user->id,
                'type' => $bestMatch->user_type,
                'name' => $userName,
                'matricule' => $user->matricule ?? null,
                'department' => $user->department ?? null,
                'shift_id' => $user->shift_id ?? null,
            ],
        ]);
    }

    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'user_type' => 'required|in:employee,intern',
            'user_id' => 'required|integer',
        ]);

        $user = $this->resolveUser($validated['user_type'], $validated['user_id']);
        $attendance = Attendance::firstOrNew([
            'user_id' => $user->id,
            'user_type' => $this->classForType($validated['user_type']),
            'date' => Carbon::today()->toDateString(),
        ]);

        if ($attendance->exists && $attendance->check_in) {
            ScanLog::create([
                'user_identifier' => $this->scanIdentifier($user),
                'accepted' => false,
                'rejection_reason' => 'Double Check-In',
                'scan_time' => now(),
            ]);

            throw ValidationException::withMessages([
                'attendance' => 'Le check-in a déjà été enregistré pour aujourd\'hui.',
            ]);
        }

        $checkInTime = Carbon::now();
        $shiftStart = Carbon::parse($user->shift->start_time ?? $checkInTime->format('H:i:s'));
        $status = $checkInTime->greaterThan($shiftStart->copy()->addMinutes(15)) ? 'late' : 'present';

        $attendance->fill([
            'check_in' => $checkInTime->format('H:i:s'),
            'status' => $status,
        ]);
        $attendance->save();

        if ($status === 'late') {
            $this->createOrUpdateAnomaly($user, 'late', 'Check-in en retard détecté automatiquement', $attendance->date);
        }

        ScanLog::create([
            'user_identifier' => $this->scanIdentifier($user),
            'accepted' => true,
            'rejection_reason' => null,
            'scan_time' => $checkInTime,
        ]);

        return response()->json([
            'message' => 'Check-in enregistré avec succès',
            'attendance' => $this->formatAttendance($attendance->fresh('user')),
        ]);
    }

    public function checkOut(Request $request)
    {
        $validated = $request->validate([
            'user_type' => 'required|in:employee,intern',
            'user_id' => 'required|integer',
        ]);

        $attendance = Attendance::where([
            'user_id' => $validated['user_id'],
            'user_type' => $this->classForType($validated['user_type']),
            'date' => Carbon::today()->toDateString(),
        ])->first();

        if (!$attendance || !$attendance->check_in) {
            ScanLog::create([
                'user_identifier' => $this->scanIdentifier($this->resolveUser($validated['user_type'], $validated['user_id'])),
                'accepted' => false,
                'rejection_reason' => 'Double Check-Out',
                'scan_time' => now(),
            ]);

            throw ValidationException::withMessages([
                'attendance' => 'Aucun check-in trouvé pour aujourd\'hui.',
            ]);
        }

        if ($attendance->check_out) {
            ScanLog::create([
                'user_identifier' => $this->scanIdentifier($this->resolveUser($validated['user_type'], $validated['user_id'])),
                'accepted' => false,
                'rejection_reason' => 'Double Check-Out',
                'scan_time' => now(),
            ]);

            throw ValidationException::withMessages([
                'attendance' => 'Le check-out a déjà été enregistré pour aujourd\'hui.',
            ]);
        }

        $user = $this->resolveUser($validated['user_type'], $validated['user_id']);
        $checkOutTime = Carbon::now();
        $checkInTime = Carbon::parse($attendance->date . ' ' . $attendance->check_in);
        $minutes = $checkInTime->diffInMinutes($checkOutTime);
        $shiftEnd = Carbon::parse($user->shift->end_time ?? $checkOutTime->format('H:i:s'));
        $status = $checkOutTime->lessThan($shiftEnd->copy()->subMinutes(15)) ? 'early_departure' : $attendance->status;

        $attendance->update([
            'check_out' => $checkOutTime->format('H:i:s'),
            'total_hours' => $minutes,
            'status' => $status,
        ]);

        if ($status === 'early_departure') {
            $this->createOrUpdateAnomaly($user, 'early_departure', 'Départ anticipé détecté automatiquement', $attendance->date);
        }

        ScanLog::create([
            'user_identifier' => $this->scanIdentifier($user),
            'accepted' => true,
            'rejection_reason' => null,
            'scan_time' => $checkOutTime,
        ]);

        return response()->json([
            'message' => 'Check-out enregistré avec succès',
            'attendance' => $this->formatAttendance($attendance->fresh('user')),
        ]);
    }

    private function resolveUser(string $type, int $id)
    {
        return $type === 'employee'
            ? Employee::with('shift')->findOrFail($id)
            : Intern::with('shift')->findOrFail($id);
    }

    private function scanIdentifier($user): string
    {
        $fullName = $user->full_name ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));

        if (empty($fullName)) {
            return 'Inconnu';
        }

        return ($user->matricule ?? class_basename($user)) . ' (' . $fullName . ')';
    }

    private function classForType(string $type): string
    {
        return $type === 'employee' ? Employee::class : Intern::class;
    }

    private function euclideanDistance(array $left, array $right): float
    {
        $sum = 0.0;

        foreach ($left as $index => $value) {
            $difference = (float) $value - (float) ($right[$index] ?? 0);
            $sum += $difference * $difference;
        }

        return sqrt($sum);
    }

    private function formatAttendance(Attendance $attendance): array
    {
        $user = $attendance->user;

        return [
            'id' => $attendance->id,
            'user_id' => $attendance->user_id,
            'user_type' => $attendance->user_type,
            'user_name' => $user ? ($user->full_name ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''))) : 'Inconnu',
            'matricule' => $user->matricule ?? null,
            'date' => $attendance->date,
            'check_in' => $attendance->check_in,
            'check_out' => $attendance->check_out,
            'total_hours' => $attendance->total_hours,
            'status' => $attendance->status,
        ];
    }

    private function createOrUpdateAnomaly($user, string $type, string $details, string $date): void
    {
        
        $userClass = is_object($user) ? get_class($user) : null;

        if (!$userClass) {
            return;
        }

        \App\Models\Anomaly::updateOrCreate(
            [
                'user_id' => $user->id,
                'user_type' => $userClass,
                'date' => $date,
                'type' => $type,
            ],
            [
                'details' => $details,
                'resolved' => false,
            ]
        );
    }
}
