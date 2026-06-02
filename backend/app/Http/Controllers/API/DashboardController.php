<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Intern;
use App\Models\Attendance;
use App\Models\Anomaly;
use Carbon\Carbon;

class DashboardController extends Controller
{
    // Statistiques principales
    public function stats()
    {
        $today = Carbon::today();
        
        // Nombre total
        $totalEmployees = Employee::count();
        $totalInterns = Intern::count();
        
        // Présences aujourd'hui
        $presentToday = Attendance::where('date', $today)
            ->whereNotNull('check_in')
            ->count();
        
        // Retards aujourd'hui
        $lateToday = Attendance::where('date', $today)
            ->where('status', 'late')
            ->count();
        
        // Absences aujourd'hui
        $absentToday = Attendance::where('date', $today)
            ->where('status', 'absent')
            ->count();
        
        // Anomalies non résolues
        $pendingAnomalies = Anomaly::where('resolved', false)->count();
        
        return response()->json([
            'total_employees' => $totalEmployees,
            'total_interns' => $totalInterns,
            'total_users' => $totalEmployees + $totalInterns,
            'present_today' => $presentToday,
            'late_today' => $lateToday,
            'absent_today' => $absentToday,
            'pending_anomalies' => $pendingAnomalies,
            'attendance_rate' => $totalEmployees > 0 ? round(($presentToday / $totalEmployees) * 100) : 0,
        ]);
    }
    
    // Présences par jour (pour les graphiques)
    public function weeklyAttendance()
    {
        $days = [];
        $attendances = [];
        
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $days[] = $date->format('D');
            
            $count = Attendance::where('date', $date)
                ->whereNotNull('check_in')
                ->count();
            
            $attendances[] = $count;
        }
        
        return response()->json([
            'days' => $days,
            'attendances' => $attendances,
        ]);
    }
    
    // Répartition Employés / Stagiaires
    public function userRepartition()
    {
        $totalEmployees = Employee::count();
        $totalInterns = Intern::count();
        
        return response()->json([
            'labels' => ['Employés', 'Stagiaires'],
            'data' => [$totalEmployees, $totalInterns],
            'colors' => ['#3B82F6', '#10B981'],
        ]);
    }
    
    // Dernières anomalies
    public function recentAnomalies()
    {
        $anomalies = Anomaly::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($anomaly) {
                $user = $anomaly->user;
                $userName = $user ? ($user->full_name ?? $user->first_name . ' ' . $user->last_name) : 'Inconnu';
                
                return [
                    'id' => $anomaly->id,
                    'user_name' => $userName,
                    'type' => $anomaly->type,
                    'date' => $anomaly->date,
                    'details' => $anomaly->details,
                    'resolved' => $anomaly->resolved,
                ];
            });
        
        return response()->json($anomalies);
    }
    
    // Top retards
    public function topLate()
    {
        $lateEmployees = Attendance::where('status', 'late')
            ->where('date', '>=', Carbon::now()->subDays(30))
            ->with('user')
            ->get()
            ->groupBy('user_id')
            ->map(function ($group) {
                $user = $group->first()->user;
                return [
                    'name' => $user ? ($user->full_name ?? $user->first_name . ' ' . $user->last_name) : 'Inconnu',
                    'late_count' => $group->count(),
                ];
            })
            ->sortByDesc('late_count')
            ->take(5)
            ->values();
        
        return response()->json($lateEmployees);
    }
}
