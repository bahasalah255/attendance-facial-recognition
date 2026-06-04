import { useEffect, useMemo, useState } from 'react';
import { Clock3, Plus, Pencil, Trash2, X, Users, AlertTriangle, CalendarRange, Sparkles } from 'lucide-react';
import api from '../../services/api';

const shiftService = {
  getAll: () => api.get('/shifts'),
  create: (data) => api.post('/shifts', data),
  update: (id, data) => api.put(`/shifts/${id}`, data),
  delete: (id) => api.delete(`/shifts/${id}`),
};

const inputStyle = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100';

const defaultForm = { name: '', start_time: '', end_time: '' };

const predefinedOrder = { Matin: 0, Soir: 1, Nuit: 2 };
const predefinedNames = ['Matin', 'Soir', 'Nuit'];

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [error, setError] = useState('');

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const response = await shiftService.getAll();
      setShifts(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => {
      const orderA = predefinedOrder[a.name] ?? 99;
      const orderB = predefinedOrder[b.name] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  }, [shifts]);

  const totalEmployees = shifts.reduce((sum, shift) => sum + (shift.employees_count || 0), 0);
  const predefinedShifts = sortedShifts.filter((shift) => predefinedNames.includes(shift.name));
  const customShifts = sortedShifts.filter((shift) => !predefinedNames.includes(shift.name));

  const openCreate = () => {
    setEditingShift(null);
    setFormData(defaultForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name || '',
      start_time: shift.start_time || '',
      end_time: shift.end_time || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShift(null);
    setFormData(defaultForm);
    setError('');
  };

  const validateLocal = () => {
    if (!formData.name.trim() || !formData.start_time || !formData.end_time) {
      return 'Veuillez remplir tous les champs.';
    }

    if (formData.start_time === formData.end_time) {
      return 'L’heure de début et de fin doit être différente.';
    }

    const candidate = { ...formData };
    const currentId = editingShift?.id;

    const overlaps = sortedShifts.some((shift) => {
      if (currentId && shift.id === currentId) return false;
      return rangesOverlap(candidate.start_time, candidate.end_time, shift.start_time, shift.end_time);
    });

    return overlaps ? 'Ce shift chevauche un autre shift existant.' : '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const localError = validateLocal();
    if (localError) {
      setError(localError);
      return;
    }

    try {
      setError('');
      const payload = { ...formData };
      if (editingShift) {
        await shiftService.update(editingShift.id, payload);
      } else {
        await shiftService.create(payload);
      }
      await loadShifts();
      closeModal();
    } catch (e) {
      const apiError = Object.values(e?.response?.data?.errors || {}).flat().join(' · ');
      setError(apiError || e?.response?.data?.message || 'Impossible d’enregistrer le shift.');
    }
  };

  const handleDelete = async (shift) => {
    const assigned = (shift.employees_count || 0) + (shift.interns_count || 0);
    if (assigned > 0) {
      setError('Ce shift ne peut pas être supprimé car il est déjà assigné.');
      return;
    }

    if (!window.confirm(`Supprimer le shift ${shift.name} ?`)) {
      return;
    }

    try {
      await shiftService.delete(shift.id);
      await loadShifts();
    } catch (e) {
      setError(e?.response?.data?.message || 'Suppression impossible.');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Chargement des shifts...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.25),_transparent_35%)]" />
        <div className="relative p-8 md:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300/90">Paramétrage RH</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Gestion des shifts</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Présentez les shifts prédéfinis dans des cartes visuelles, puis créez, modifiez ou supprimez un shift si aucune affectation n'est liée.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5">
            <Plus className="h-4 w-4" /> Nouveau shift
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard icon={Clock3} label="Shifts total" value={sortedShifts.length} tone="amber" />
        <MetricCard icon={Users} label="Employés assignés" value={totalEmployees} tone="blue" />
        <MetricCard icon={Sparkles} label="Shifts prédéfinis" value={Math.min(3, sortedShifts.length)} tone="emerald" />
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Shifts prédéfinis</h2>
            <p className="text-sm text-slate-500">Les trois créneaux principaux affichés dans le même esprit que le dashboard.</p>
          </div>
          <div className="text-sm text-slate-500">
            {predefinedShifts.length}/3 configurés
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {predefinedNames.map((name) => {
            const shift = predefinedShifts.find((item) => item.name === name);
            const assigned = shift?.total_assigned || 0;
            return (
              <div key={name} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
                <div className="px-6 pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Shift prédéfini</p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900">{name}</h3>
                    </div>
                    <div className="rounded-2xl bg-sky-50 px-4 py-3 text-right text-sky-700 shadow-sm">
                      <p className="text-xs uppercase tracking-wide">Employés</p>
                      <p className="text-2xl font-bold text-slate-900">{shift?.employees_count || 0}</p>
                    </div>
                  </div>

                  {shift ? (
                    <>
                      <div className="mt-5">
                        <p className="text-sm font-medium text-slate-500">Horaires</p>
                        <p className="mt-1 text-3xl font-bold text-slate-900">{shift.start_time} - {shift.end_time}</p>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <InfoPill label="Début" value={shift.start_time} />
                        <InfoPill label="Fin" value={shift.end_time} />
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {assigned} utilisateur{assigned > 1 ? 's' : ''} lié{assigned > 1 ? 's' : ''} à ce shift.
                      </div>

                      <div className="mt-5 flex gap-3 pb-6">
                        <button type="button" onClick={() => openEdit(shift)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                          <Pencil className="mr-2 inline-block h-4 w-4" /> Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(shift)}
                          disabled={assigned > 0}
                          className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <Trash2 className="mr-2 inline-block h-4 w-4" /> Supprimer
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Ce shift n’est pas encore configuré.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Shifts personnalisés</h2>
            <p className="text-sm text-slate-500">Ajoutez ou gérez les autres shifts dans une grille légère.</p>
          </div>
          <p className="text-sm text-slate-500">{customShifts.length} shift{customShifts.length > 1 ? 's' : ''}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {customShifts.map((shift) => {
          const assigned = (shift.employees_count || 0) + (shift.interns_count || 0);
          const canDelete = assigned === 0;

          return (
            <div key={shift.id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(15,23,42,0.10)]">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      <CalendarRange className="h-3.5 w-3.5" /> {shift.name}
                    </span>
                    <h2 className="mt-4 text-2xl font-bold text-slate-900">{shift.start_time} - {shift.end_time}</h2>
                    <p className="mt-2 text-sm text-slate-500">Créneau horaire configuré pour les affectations RH.</p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Assignés</p>
                    <p className="text-2xl font-bold text-slate-900">{shift.employees_count || 0}</p>
                    <p className="text-xs text-slate-500">employés</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <InfoPill label="Début" value={shift.start_time} />
                  <InfoPill label="Fin" value={shift.end_time} />
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {assigned} utilisateur{assigned > 1 ? 's' : ''} lié{assigned > 1 ? 's' : ''} au shift.
                </div>

                {!canDelete ? (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Suppression bloquée tant que des employés ou stagiaires sont assignés.
                  </div>
                ) : null}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(shift)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  >
                    <Pencil className="h-4 w-4" /> Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(shift)}
                    disabled={!canDelete}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {!sortedShifts.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aucun shift trouvé.
        </div>
      ) : null}

      {showModal ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-3xl">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-600">Gestion shift</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{editingShift ? 'Modifier le shift' : 'Créer un shift'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Saisissez des horaires cohérents, sans chevauchement.</p>
                </div>
                <button onClick={closeModal} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Fermer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Nom du shift">
                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputStyle} placeholder="Matin" required />
                  </Field>
                  <Field label="Heure de début">
                    <input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className={inputStyle} required />
                  </Field>
                  <Field label="Heure de fin">
                    <input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className={inputStyle} required />
                  </Field>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Les champs horaire utilisent le format <span className="font-semibold text-slate-900">HH:MM</span>. Le système bloque les intervalles qui se chevauchent.
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Annuler</button>
                  <button type="submit" className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">{editingShift ? 'Enregistrer' : 'Créer'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ icon: Icon, label, value, tone }) {
  const tones = {
    amber: 'from-amber-50 to-orange-50 text-amber-700 border-amber-100',
    blue: 'from-sky-50 to-cyan-50 text-sky-700 border-sky-100',
    emerald: 'from-emerald-50 to-green-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div className={`rounded-[1.5rem] border bg-gradient-to-br p-5 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function rangesOverlap(startA, endA, startB, endB) {
  const expandRange = (start, end) => {
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);

    if (endMinutes > startMinutes) {
      return [[startMinutes, endMinutes]];
    }

    return [
      [startMinutes, 1440],
      [0, endMinutes],
    ];
  };

  const segmentsA = expandRange(startA, endA);
  const segmentsB = expandRange(startB, endB);

  return segmentsA.some(([aStart, aEnd]) => segmentsB.some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd));
}

function toMinutes(time) {
  const [hours, minutes] = time.slice(0, 5).split(':');
  return (Number(hours) * 60) + Number(minutes);
}