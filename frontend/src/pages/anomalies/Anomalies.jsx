import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Filter, MessageSquareText, Search, ShieldAlert, Clock3 } from 'lucide-react';
import api from '../../services/api';

const anomalyService = {
  getAll: (config = {}) => api.get('/anomalies', config),
  update: (id, data) => api.put(`/anomalies/${id}`, data),
};

const typeMeta = {
  absence: { label: 'Absence', tone: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  late: { label: 'Retard', tone: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  early_departure: { label: 'Départ anticipé', tone: 'bg-yellow-50 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  insufficient_hours: { label: 'Heures insuffisantes', tone: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  forgot_checkin: { label: 'Pointage entrée oublié', tone: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  forgot_checkout: { label: 'Pointage sortie oublié', tone: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', dot: 'bg-fuchsia-500' },
  out_of_schedule: { label: 'Hors planning', tone: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

const statusOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'Non résolues' },
  { value: 'resolved', label: 'Résolues' },
];

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnomalies();
  }, [typeFilter, statusFilter, dateFilter]);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const response = await anomalyService.getAll({ params });
      setAnomalies(response.data);
    } catch (e) {
      console.error(e);
      setError('Impossible de charger les anomalies.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnomalies = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return anomalies.filter((anomaly) => {
      if (!query) return true;

      return [anomaly.user_name, anomaly.type, anomaly.details, anomaly.date]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [anomalies, searchTerm]);

  const stats = useMemo(() => ({
    total: anomalies.length,
    pending: anomalies.filter((item) => !item.resolved).length,
    resolved: anomalies.filter((item) => item.resolved).length,
  }), [anomalies]);

  const openResolve = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setComment(anomaly.comment || '');
    setError('');
  };

  const closeResolve = () => {
    setSelectedAnomaly(null);
    setComment('');
  };

  const handleResolve = async (event) => {
    event.preventDefault();

    try {
      setError('');
      await anomalyService.update(selectedAnomaly.id, {
        resolved: true,
        comment: comment.trim() || null,
      });
      await loadAnomalies();
      closeResolve();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de marquer cette anomalie comme résolue.');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Chargement des anomalies...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(239,68,68,0.20),_transparent_35%)]" />
        <div className="relative p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300/90">Pilotage RH</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Gestion des anomalies</h1>
              <p className="mt-2 max-w-3xl text-slate-300">
                Suivez les absences, retards, départs anticipés et heures insuffisantes, puis traitez chaque anomalie après investigation.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <HeroMetric label="Total" value={stats.total} />
              <HeroMetric label="Non résolues" value={stats.pending} />
              <HeroMetric label="Résolues" value={stats.resolved} />
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Filtres</h2>
            <p className="text-sm text-slate-500">Priorisez les anomalies selon leur type, leur statut et leur date.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 xl:min-w-[900px]">
            <FilterField icon={Search} label="Recherche">
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Utilisateur, type, détail..." className={inputStyle} />
            </FilterField>
            <FilterField icon={Filter} label="Type">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputStyle}>
                <option value="all">Tous les types</option>
                <option value="absence">Absence</option>
                <option value="late">Retard</option>
                <option value="early_departure">Départ anticipé</option>
                <option value="insufficient_hours">Heures insuffisantes</option>
                <option value="forgot_checkin">Pointage entrée oublié</option>
                <option value="forgot_checkout">Pointage sortie oublié</option>
                <option value="out_of_schedule">Hors planning</option>
              </select>
            </FilterField>
            <FilterField icon={ShieldAlert} label="Statut">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputStyle}>
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
                <Th>Date</Th>
                <Th>Utilisateur</Th>
                <Th>Type</Th>
                <Th>Détails</Th>
                <Th>Statut</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredAnomalies.length ? filteredAnomalies.map((anomaly) => {
                const meta = typeMeta[anomaly.type] || typeMeta.out_of_schedule;

                return (
                  <tr key={anomaly.id} className="hover:bg-slate-50/80 transition">
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{formatDate(anomaly.date)}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="font-semibold text-slate-900">{anomaly.user_name}</div>
                      <div className="text-xs text-slate-500">{anomaly.user_type || 'Utilisateur'}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-[520px]">
                      <p className="leading-6">{anomaly.details}</p>
                      {anomaly.comment ? (
                        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">Commentaire :</span> {anomaly.comment}
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge resolved={anomaly.resolved} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openResolve(anomaly)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        disabled={anomaly.resolved}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {anomaly.resolved ? 'Résolue' : 'Marquer résolue'}
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center text-slate-500">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">Aucune anomalie trouvée</p>
                      <p className="mt-2 text-sm text-slate-500">Ajustez les filtres ou changez de période pour voir d’autres anomalies.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAnomaly ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-2xl">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Investigation</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Marquer comme résolue</h2>
                  <p className="mt-1 text-sm text-slate-500">Ajoutez éventuellement un commentaire après vérification.</p>
                </div>
                <button onClick={closeResolve} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Fermer">
                  <Clock3 className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleResolve} className="space-y-5 p-6 md:p-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{selectedAnomaly.user_name}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedAnomaly.details}</p>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Commentaire d'investigation</span>
                  <textarea
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={`${inputStyle} min-h-[120px] resize-y`}
                    placeholder="Expliquer la résolution, si nécessaire..."
                  />
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeResolve} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Annuler</button>
                  <button type="submit" className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">Valider la résolution</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
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

function StatusBadge({ resolved }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${resolved ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      <span className={`h-2 w-2 rounded-full ${resolved ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {resolved ? 'Résolue' : 'Non résolue'}
    </span>
  );
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}