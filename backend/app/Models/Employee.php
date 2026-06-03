<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'matricule',
        'full_name',
        'photo',
        'photos',
        'position',
        'department',
        'shift_id',
        'hire_date',
    ];

    protected $casts = [
        'photos' => 'array',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
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

    public static function generateMatricule()
    {
        $last = self::orderBy('id', 'desc')->first();
        $num = $last ? intval(substr($last->matricule, 4)) + 1 : 1;
        return 'EMP-' . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
}