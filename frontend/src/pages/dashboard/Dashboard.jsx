import { useEffect, useMemo, useState } from 'react';
import {
  default as api,
  dashboardService,
} from '../../services/api';
import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [weekly, setWeekly] = useState({ days: [], attendances: [] });
  const [monthly, setMonthly] = useState({ months: [], attendances: [] });
  const [repartition, setRepartition] = useState({ labels: [], data: [], colors: [] });
  const [byShift, setByShift] = useState([]);
  const [byService, setByService] = useState({ labels: [], data: [] });
  const [dailyOverview, setDailyOverview] = useState([]);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [topLate, setTopLate] = useState([]);
  const [loading, setLoading] = useState(true);
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const dashboardApi = {
    getStats: () => dashboardService?.getStats?.() ?? api.get('/dashboard/stats'),
    getWeeklyAttendance: () => dashboardService?.getWeeklyAttendance?.() ?? api.get('/dashboard/weekly'),
    getMonthlyAttendance: () => dashboardService?.getMonthlyAttendance?.() ?? api.get('/dashboard/monthly'),
    getRepartition: () => dashboardService?.getRepartition?.() ?? api.get('/dashboard/repartition'),
    getByShift: () => dashboardService?.getByShift?.() ?? api.get('/dashboard/by-shift'),
    getByService: () => dashboardService?.getByService?.() ?? api.get('/dashboard/by-service'),
    getDailyOverview: () => dashboardService?.getDailyOverview?.() ?? api.get('/dashboard/daily-overview'),
    getRecentAnomalies: () => dashboardService?.getRecentAnomalies?.() ?? api.get('/dashboard/anomalies'),
    getTopLate: () => dashboardService?.getTopLate?.() ?? api.get('/dashboard/top-late'),
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, weeklyRes, monthlyRes, repartitionRes, byShiftRes, byServiceRes, dailyRes, anomaliesRes, topLateRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getWeeklyAttendance(),
        dashboardApi.getMonthlyAttendance(),
        dashboardApi.getRepartition(),
        dashboardApi.getByShift(),
        dashboardApi.getByService(),
        dashboardApi.getDailyOverview(),
        dashboardApi.getRecentAnomalies(),
        dashboardApi.getTopLate(),
      ]);

      setStats(statsRes.data);
      setWeekly(weeklyRes.data);
      setMonthly(monthlyRes.data);
      setRepartition(repartitionRes.data);
      setByShift(byShiftRes.data);
      setByService(byServiceRes.data);
      setDailyOverview(dailyRes.data);
      setRecentAnomalies(anomaliesRes.data);
      setTopLate(topLateRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Employés', value: stats?.total_employees || 0, icon: '👥', color: 'from-blue-500 to-blue-600' },
    { title: 'Stagiaires', value: stats?.total_interns || 0, icon: '🎓', color: 'from-green-500 to-green-600' },
    { title: 'Présents', value: stats?.present_today || 0, icon: '✅', color: 'from-emerald-500 to-emerald-600' },
    { title: 'Retards', value: stats?.late_today || 0, icon: '⏰', color: 'from-orange-500 to-orange-600' },
    { title: 'Absents estimés', value: stats?.estimated_absent_today || 0, icon: '🚫', color: 'from-red-500 to-red-600' },
    { title: 'Anomalies', value: stats?.pending_anomalies || 0, icon: '⚠️', color: 'from-violet-500 to-violet-600' },
  ];

  const pieData = (repartition?.labels || []).map((label, index) => ({
    name: label,
    value: repartition?.data?.[index] || 0,
    color: repartition?.colors?.[index] || '#8884d8',
  }));

  const serviceData = (byService?.labels || []).map((label, index) => ({
    name: label,
    value: byService?.data?.[index] || 0,
  }));

  const trendCards = [
    {
      title: 'Taux de présence',
      value: `${stats?.attendance_rate || 0}%`,
      note: 'sur l\'ensemble des utilisateurs',
      accent: 'from-sky-500 to-cyan-500',
    },
    {
      title: 'Moyenne de travail',
      value: `${stats?.average_work_minutes_today || 0} min`,
      note: 'moyenne aujourd\'hui',
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Anomalies en attente',
      value: stats?.pending_anomalies || 0,
      note: 'à traiter par RH',
      accent: 'from-violet-500 to-fuchsia-500',
    },
  ];

  const hasSeries = (data = []) => Array.isArray(data) && data.some((value) => Number(value) > 0);

  const weeklySeries = useMemo(
    () => (weekly.days || []).map((day, index) => ({ day, attendances: weekly.attendances?.[index] || 0 })),
    [weekly]
  );

  const monthlySeries = useMemo(
    () => (monthly.months || []).map((month, index) => ({ month, attendances: monthly.attendances?.[index] || 0 })),
    [monthly]
  );

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.25),_transparent_35%)]" />
        <div className="relative p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300/90">RH Intelligence Hub</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Tableau de bord</h1>
              <p className="mt-2 text-slate-300 max-w-2xl">
                {admin.name ? `Bienvenue, ${admin.name} !` : 'Vue consolidée des présences, anomalies et tendances.'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {trendCards.map((item) => (
                <div key={item.title} className={`rounded-2xl bg-white/10 backdrop-blur px-4 py-3 border border-white/10`}>
                  <p className="text-xs text-slate-300">{item.title}</p>
                  <p className="text-lg font-semibold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                <p className="text-xs text-gray-400 mt-2">Indicateur RH en temps réel</p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-r ${card.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Présences hebdomadaires</h3>
              <p className="text-sm text-slate-500">Vue des 7 derniers jours</p>
            </div>
            <span className="rounded-full bg-sky-50 text-sky-700 px-3 py-1 text-xs font-semibold">Insights</span>
          </div>
          <div className="h-[320px]">
            {hasSeries(weekly.attendances) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklySeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weeklyLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="attendances" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} fill="url(#weeklyLine)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Aucune donnée hebdomadaire" description="Les présences apparaîtront ici après les premiers pointages." />
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Répartition employés / stagiaires</h3>
              <p className="text-sm text-slate-500">Structure globale des utilisateurs</p>
            </div>
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold">Mix RH</span>
          </div>
          <div className="h-[320px]">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Aucune répartition disponible" description="Ajoutez des utilisateurs pour visualiser la structure." />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Présences mensuelles</h3>
              <p className="text-sm text-slate-500">Tendance sur 6 mois</p>
            </div>
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold">Trend</span>
          </div>
          <div className="h-[300px]">
            {hasSeries(monthly.attendances) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="attendances" fill="#10b981" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Aucune donnée mensuelle" description="Les statistiques mensuelles apparaîtront ici." />
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Présence par service</h3>
              <p className="text-sm text-slate-500">Top des services les plus actifs</p>
            </div>
            <span className="rounded-full bg-violet-50 text-violet-700 px-3 py-1 text-xs font-semibold">Service</span>
          </div>
          <div className="h-[300px]">
            {serviceData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Aucune donnée par service" description="Les services s’afficheront après les premiers enregistrements." />
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Présence par shift</h3>
              <p className="text-sm text-slate-500">Répartition opérationnelle</p>
            </div>
            <span className="rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold">Shift</span>
          </div>
          <div className="space-y-3">
            {byShift.length ? byShift.map((shift) => (
              <div key={shift.name} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/80">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{shift.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{shift.employees} employés · {shift.interns} stagiaires</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{shift.total}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${Math.min(100, shift.total * 10)}%` }} />
                </div>
              </div>
            )) : (
              <EmptyState title="Aucune donnée de shift" description="Les shifts apparaîtront ici une fois les utilisateurs affectés." />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Vue du jour</h3>
              <p className="text-sm text-slate-500">Derniers pointages du jour</p>
            </div>
            <span className="rounded-full bg-sky-50 text-sky-700 px-3 py-1 text-xs font-semibold">Live</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {dailyOverview.map((item, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50/80">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.type} · {item.check_in || 'N/A'}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${item.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {item.status}
                </span>
              </div>
            ))}
            {!dailyOverview.length && <EmptyState title="Aucun pointage du jour" description="Les pointages apparaîtront ici en temps réel." compact />}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Insights RH</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {trendCards.map((item) => (
              <div key={item.title} className={`rounded-2xl bg-gradient-to-br ${item.accent} p-4 text-white shadow-lg`}>
                <p className="text-sm/5 text-white/80">{item.title}</p>
                <p className="text-2xl font-bold mt-2">{item.value}</p>
                <p className="text-xs mt-1 text-white/80">{item.note}</p>
              </div>
            ))}
          </div>

          <h4 className="text-base font-semibold text-slate-900 mb-3">Top retards</h4>
          <div className="space-y-3 mb-6">
            {topLate.map((item, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <span className="text-slate-800">{item.name}</span>
                <span className="font-semibold text-orange-600">{item.late_count}</span>
              </div>
            ))}
            {!topLate.length && <EmptyState title="Aucun retard détecté" description="Les retardataires les plus fréquents s'afficheront ici." compact />}
          </div>

          <h4 className="text-base font-semibold text-slate-900 mb-3">Anomalies récentes</h4>
          <div className="space-y-3 max-h-48 overflow-auto pr-1">
            {recentAnomalies.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{item.user_name}</span>
                  <span className="text-xs text-violet-600 font-semibold">{item.type}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.details}</p>
              </div>
            ))}
            {!recentAnomalies.length && <EmptyState title="Aucune anomalie récente" description="Les anomalies détectées par le système apparaîtront ici." compact />}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl p-6 md:p-8">
        <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
          <div>
            <h3 className="text-xl font-semibold">Résumé journalier</h3>
            <p className="text-slate-300 mt-1">Synthèse opérationnelle RH pour la journée en cours.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <MetricPill label="Absences estimées" value={stats?.estimated_absent_today || 0} color="text-red-300" />
            <MetricPill label="Heures moyennes" value={`${stats?.average_work_minutes_today || 0} min`} color="text-sky-300" />
            <MetricPill label="Taux de présence" value={`${stats?.attendance_rate || 0}%`} color="text-emerald-300" />
            <MetricPill label="Anomalies" value={stats?.pending_anomalies || 0} color="text-violet-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, compact = false }) {
  return (
    <div className={`flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center ${compact ? 'min-h-[120px] py-4' : 'py-8'}`}>
      <div className="text-3xl mb-2">📈</div>
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>
    </div>
  );
}

function MetricPill({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 min-w-[120px]">
      <p className="text-xs text-slate-300">{label}</p>
      <p className={`text-lg font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
