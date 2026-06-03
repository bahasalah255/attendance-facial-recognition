<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Exports\AttendanceReportExport;
use App\Models\Attendance;
use App\Models\Anomaly;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $from = $request->query('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->query('to', Carbon::now()->toDateString());

        $attendanceQuery = Attendance::with('user')
            ->whereBetween('date', [$from, $to]);

        $attendances = $attendanceQuery->orderByDesc('date')->get();

        return response()->json([
            'from' => $from,
            'to' => $to,
            'summary' => [
                'total' => $attendances->count(),
                'present' => $attendances->where('status', 'present')->count(),
                'late' => $attendances->where('status', 'late')->count(),
                'absent' => $attendances->where('status', 'absent')->count(),
                'early_departure' => $attendances->where('status', 'early_departure')->count(),
                'anomalies' => Anomaly::whereBetween('date', [$from, $to])->count(),
            ],
            'attendances' => $attendances->map(fn ($attendance) => [
                'id' => $attendance->id,
                'name' => $attendance->user ? ($attendance->user->full_name ?? trim(($attendance->user->first_name ?? '') . ' ' . ($attendance->user->last_name ?? ''))) : 'Inconnu',
                'type' => class_basename($attendance->user_type),
                'date' => $attendance->date,
                'check_in' => $attendance->check_in,
                'check_out' => $attendance->check_out,
                'total_hours' => $attendance->total_hours,
                'status' => $attendance->status,
            ]),
        ]);
    }

    public function pdf(Request $request)
    {
        $data = $this->buildReportData($request);
        $pdf = Pdf::loadView('reports.attendance', $data);

        return $pdf->download('rapport-attendance.pdf');
    }

    public function excel(Request $request)
    {
        $data = $this->buildReportData($request);

        return Excel::download(new AttendanceReportExport($data), 'rapport-attendance.xlsx');
    }

    private function buildReportData(Request $request): array
    {
        $from = $request->query('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->query('to', Carbon::now()->toDateString());
        $attendances = Attendance::with('user')
            ->whereBetween('date', [$from, $to])
            ->orderByDesc('date')
            ->get();

        return [
            'from' => $from,
            'to' => $to,
            'summary' => [
                'total' => $attendances->count(),
                'present' => $attendances->where('status', 'present')->count(),
                'late' => $attendances->where('status', 'late')->count(),
                'absent' => $attendances->where('status', 'absent')->count(),
                'early_departure' => $attendances->where('status', 'early_departure')->count(),
            ],
            'attendances' => $attendances,
        ];
    }
}
