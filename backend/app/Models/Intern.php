<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Intern extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'photo',
        'photos',
        'establishment',
        'internship_type',
        'start_date',
        'end_date',
        'duration',
        'supervisor_id',
        'service',
        'shift_id',
    ];

    protected $casts = [
        'photos' => 'array',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function supervisor()
    {
        return $this->belongsTo(Supervisor::class);
    }

    public function faceData()
    {
        return $this->morphOne(FaceData::class, 'user');
    }

    public function attendances()
    {
        return $this->morphMany(Attendance::class, 'user');
    }

    public function anomalies()
    {
        return $this->morphMany(Anomaly::class, 'user');
    }

    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }
}