<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AttendanceReportExport implements FromCollection, WithHeadings
{
    public function __construct(private array $data)
    {
    }

    public function collection(): Collection
    {
        return collect($this->data['attendances'])->map(function ($attendance) {
            return [
                $attendance->date,
                $attendance->user ? ($attendance->user->full_name ?? trim(($attendance->user->first_name ?? '') . ' ' . ($attendance->user->last_name ?? ''))) : 'Inconnu',
                class_basename($attendance->user_type),
                $attendance->check_in,
                $attendance->check_out,
                $attendance->total_hours,
                $attendance->status,
            ];
        });
    }

    public function headings(): array
    {
        return ['Date', 'Nom', 'Type', 'Check In', 'Check Out', 'Durée (min)', 'Statut'];
    }
}