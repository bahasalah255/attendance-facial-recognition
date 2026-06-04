<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ScanLog;

class ScanLogController extends Controller
{
    public function index()
    {
        $logs = ScanLog::orderByDesc('scan_time')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ScanLog $log) => [
                'id' => $log->id,
                'user_identifier' => $log->user_identifier,
                'accepted' => $log->accepted,
                'result' => $log->accepted ? 'accepted' : 'rejected',
                'rejection_reason' => $log->accepted ? null : $this->formatReason($log->rejection_reason),
                'raw_rejection_reason' => $log->rejection_reason,
                'scan_time' => $log->scan_time?->toDateTimeString(),
            ]);

        return response()->json($logs);
    }

    private function formatReason(?string $reason): string
    {
        if (!$reason) {
            return '-';
        }

        return match (true) {
            str_contains($reason, 'Utilisateur inconnu') => 'Utilisateur inconnu',
            str_contains($reason, 'Anti-spam') => 'Anti-spam',
            str_contains($reason, 'Double Check-In') => 'Double Check-In',
            str_contains($reason, 'Double Check-Out') => 'Double Check-Out',
            default => $reason,
        };
    }
}