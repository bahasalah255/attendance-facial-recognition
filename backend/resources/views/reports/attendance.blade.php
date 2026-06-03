<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de présence</title>
    <style>
        body { font-family: Arial, sans-serif; color: #111827; font-size: 12px; }
        h1 { font-size: 22px; margin-bottom: 8px; }
        .muted { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background: #eff6ff; }
        .summary { display: flex; gap: 12px; margin-top: 12px; }
        .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 12px; width: 100%; }
        .value { font-size: 18px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Rapport de présence</h1>
    <div class="muted">Période: {{ $from }} - {{ $to }}</div>

    <div class="summary">
        <div class="card"><div>Total</div><div class="value">{{ $summary['total'] }}</div></div>
        <div class="card"><div>Présents</div><div class="value">{{ $summary['present'] }}</div></div>
        <div class="card"><div>Retards</div><div class="value">{{ $summary['late'] }}</div></div>
        <div class="card"><div>Absences</div><div class="value">{{ $summary['absent'] }}</div></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Durée</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendances as $attendance)
                <tr>
                    <td>{{ $attendance->date }}</td>
                    <td>{{ $attendance->user ? ($attendance->user->full_name ?? trim(($attendance->user->first_name ?? '') . ' ' . ($attendance->user->last_name ?? ''))) : 'Inconnu' }}</td>
                    <td>{{ class_basename($attendance->user_type) }}</td>
                    <td>{{ $attendance->check_in }}</td>
                    <td>{{ $attendance->check_out }}</td>
                    <td>{{ $attendance->total_hours }}</td>
                    <td>{{ $attendance->status }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>