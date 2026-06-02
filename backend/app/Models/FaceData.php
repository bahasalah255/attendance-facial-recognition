<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FaceData extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_type',
        'face_descriptors',
        'last_scan_time',
    ];

    protected $casts = [
        'face_descriptors' => 'array',
        'last_scan_time' => 'datetime',
    ];

    public function user()
    {
        return $this->morphTo();
    }
}