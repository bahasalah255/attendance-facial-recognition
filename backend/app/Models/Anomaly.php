<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Anomaly extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_type',
        'date',
        'type',
        'details',
        'resolved',
    ];

    protected $casts = [
        'resolved' => 'boolean',
    ];

    public function user()
    {
        return $this->morphTo();
    }
}