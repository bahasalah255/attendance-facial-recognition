<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\AttendanceController;
use App\Http\Controllers\API\EmployeeController;
use App\Http\Controllers\API\InternController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\SupervisorController;
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
// Routes publiques
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées (nécessitent token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('interns', InternController::class);
    Route::apiResource('supervisors', SupervisorController::class);
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance/recognize', [AttendanceController::class, 'recognize']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/reports/pdf', [ReportController::class, 'pdf']);
    Route::get('/reports/excel', [ReportController::class, 'excel']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/weekly', [DashboardController::class, 'weeklyAttendance']);
    Route::get('/dashboard/monthly', [DashboardController::class, 'monthlyAttendance']);
    Route::get('/dashboard/repartition', [DashboardController::class, 'userRepartition']);
    Route::get('/dashboard/by-shift', [DashboardController::class, 'attendanceByShift']);
    Route::get('/dashboard/by-service', [DashboardController::class, 'attendanceByService']);
    Route::get('/dashboard/daily-overview', [DashboardController::class, 'dailyOverview']);
    Route::get('/dashboard/anomalies', [DashboardController::class, 'recentAnomalies']);
    Route::get('/dashboard/top-late', [DashboardController::class, 'topLate']);
});
