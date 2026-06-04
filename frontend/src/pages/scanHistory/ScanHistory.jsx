import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, FileClock, Filter, Search, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const scanLogService = {
  getAll: (config = {}) => api.get('/scan-logs', config),
};

const resultMeta = {
  accepted: { label: 'Accepté', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejeté', tone: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

const reasonMeta = {
  'Utilisateur inconnu': { tone: 'bg-red-50 text-red-700 border-red-200' },
  'Anti-spam': { tone: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Double Check-In': { tone: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  'Double Check-Out': { tone: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export default function ScanHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, [resultFilter, dateFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (resultFilter !== 'all') params.result = resultFilter;
      if (dateFilter) params.date = dateFilter;

      const response = await scanLogService.getAll({ params });
      setLogs(response.data);
    } catch (e) {
      console.error(e);
      setError('Impossible de charger l’historique des scans.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return logs.filter((log) => {
      if (!query) return true;
      return [log.user_identifier, log.rejection_reason, log.scan_time, log.result]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [logs, searchTerm]);

  const stats = useMemo(() => ({
    total: logs.length,
    accepted: logs.filter((item) => item.accepted).length,
    rejected: logs.filter((item) => !item.accepted).length,
  }), [logs]);

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Chargement de l’historique des scans...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.25),_transparent_35%)]" />
        <div className="relative p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300/90">Traçabilité</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Historique des scans</h1>
              <p className="mt-2 max-w-3xl text-slate-300">
                Tous les événements enregistrés dans `scan_logs` avec l’utilisateur concerné, l’horodatage, le résultat et le motif exact en cas de rejet.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <HeroMetric label="Total" value={stats.total} />
              <HeroMetric label="Acceptés" value={stats.accepted} />
              <HeroMetric label="Rejetés" value={stats.rejected} />
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Filtres</h2>
            <p className="text-sm text-slate-500">Priorisez les tentatives d’accès non autorisé et les scans rejetés.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:min-w-[760px]">
            <FilterField icon={Search} label="Recherche">
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Utilisateur, motif, date..." className={inputStyle} />
            </FilterField>
            <FilterField icon={ShieldAlert} label="Résultat">
              <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className={inputStyle}>
                <option value="all">Tous</option>
                <option value="accepted">Acceptés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </FilterField>
            <FilterField icon={CalendarDays} label="Date">
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={inputStyle} />
            </FilterField>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Date / heure</Th>
                <Th>Utilisateur</Th>
                <Th>Résultat</Th>
                <Th>Motif</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredLogs.length ? filteredLogs.map((log) => {
                const meta = resultMeta[log.result] || resultMeta.rejected;
                const reasonBadge = reasonMeta[log.rejection_reason] || { tone: 'bg-slate-100 text-slate-700 border-slate-200' };

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">{formatDateTime(log.scan_time)}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="font-semibold text-slate-900">{log.user_identifier || 'Inconnu'}</div>
                      <div className="text-xs text-slate-500">Traçabilité complète</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {log.accepted ? (
                        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Scan validé
                        </span>
                      ) : (
                        <div className="space-y-2">
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${reasonBadge.tone}`}>
                            <AlertTriangle className="h-3.5 w-3.5" /> {log.rejection_reason || 'Motif non précisé'}
                          </span>
                          {log.raw_rejection_reason ? (
                            <p className="max-w-2xl leading-6 text-slate-500">{describeReason(log.raw_rejection_reason)}</p>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="4" className="px-5 py-16 text-center text-slate-500">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <FileClock className="h-5 w-5" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">Aucun scan trouvé</p>
                      <p className="mt-2 text-sm text-slate-500">Ajustez les filtres ou effectuez de nouveaux scans pour remplir l’historique.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 border border-white/10 min-w-[110px]">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function FilterField({ label, icon: Icon, children }) {
  return (
    <label className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon className="h-4 w-4 text-slate-400" />
        <span>{label}</span>
      </div>
      {children}
    </label>
  );
}

function Th({ children }) {
  return <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</th>;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function describeReason(reason) {
  const descriptions = {
    'Utilisateur inconnu': 'Le visage n’a pas été reconnu par le système.',
    'Anti-spam': 'Un nouveau scan a été tenté avant le délai minimum autorisé.',
    'Double Check-In': 'Un check-in a déjà été enregistré pour cette personne aujourd’hui.',
    'Double Check-Out': 'Un check-out a déjà été enregistré ou aucun check-in valide n’a été trouvé.',
  };

  return descriptions[reason] || reason;
}