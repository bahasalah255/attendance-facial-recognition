<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\EmployeeController;
use App\Http\Controllers\API\InternController;
use App\Http\Controllers\API\DashboardController;
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
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/weekly', [DashboardController::class, 'weeklyAttendance']);
    Route::get('/dashboard/repartition', [DashboardController::class, 'userRepartition']);
    Route::get('/dashboard/anomalies', [DashboardController::class, 'recentAnomalies']);
    Route::get('/dashboard/top-late', [DashboardController::class, 'topLate']);
});
