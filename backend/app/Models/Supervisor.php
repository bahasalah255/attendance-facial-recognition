<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supervisor extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'department',
        'photo',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
    ];

    public function interns()
    {
        return $this->hasMany(Intern::class);
    }

    public function faceData()
    {
        return $this->morphOne(FaceData::class, 'user');
    }

    public function attendances()
    {
        return $this->morphMany(\App\Models\Attendance::class, 'user');
    }

    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }
}