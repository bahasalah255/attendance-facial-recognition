<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Anomaly;
use Illuminate\Http\Request;

class AnomalyController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'type' => 'nullable|string',
            'status' => 'nullable|in:resolved,pending,all',
            'date' => 'nullable|date',
        ]);

        $anomalies = Anomaly::with('user')
            ->when($validated['type'] ?? null, fn ($query, $type) => $query->where('type', $type))
            ->when(isset($validated['status']) && $validated['status'] !== 'all', function ($query) use ($validated) {
                return $query->where('resolved', $validated['status'] === 'resolved');
            })
            ->when($validated['date'] ?? null, fn ($query, $date) => $query->whereDate('date', $date))
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Anomaly $anomaly) => $this->formatAnomaly($anomaly));

        return response()->json($anomalies);
    }

    public function update(Request $request, Anomaly $anomaly)
    {
        $validated = $request->validate([
            'resolved' => 'required|boolean',
            'comment' => 'nullable|string|max:2000',
        ]);

        $anomaly->update([
            'resolved' => $validated['resolved'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return response()->json($this->formatAnomaly($anomaly->fresh('user')));
    }

    private function formatAnomaly(Anomaly $anomaly): array
    {
        $user = $anomaly->user;
        $userName = $user ? ($user->full_name ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''))) : 'Inconnu';

        return [
            'id' => $anomaly->id,
            'user_name' => $userName,
            'user_type' => class_basename($anomaly->user_type),
            'type' => $anomaly->type,
            'date' => $anomaly->date,
            'details' => $anomaly->details,
            'resolved' => $anomaly->resolved,
            'comment' => $anomaly->comment,
        ];
    }
}