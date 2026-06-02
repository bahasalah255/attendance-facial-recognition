<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendance';

    protected $fillable = [
        'user_id',
        'user_type',
        'date',
        'check_in',
        'check_out',
        'total_hours',
        'status',
    ];

    public function user()
    {
        return $this->morphTo();
    }
}