<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScanLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_identifier',
        'accepted',
        'rejection_reason',
        'scan_time',
    ];

    protected $casts = [
        'accepted' => 'boolean',
        'scan_time' => 'datetime',
    ];
}