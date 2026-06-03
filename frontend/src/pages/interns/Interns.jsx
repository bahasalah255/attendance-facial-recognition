import { useState, useEffect, useRef } from 'react';
import { internService, supervisorService } from '../../services/api';
import {
  createInternWithFaceData,
  updateInternWithFaceData,
} from '../../services/faceRecognition';
import { Plus, Pencil, Trash2, Search, X, Camera, RefreshCcw } from 'lucide-react';

export default function Interns() {
  const [interns, setInterns] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    establishment: '',
    internship_type: 'PFE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    duration: 0,
    supervisor_id: '',
    service: '',
    shift_id: 4,
  });
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [capturedPhotoDataUrls, setCapturedPhotoDataUrls] = useState([]);
  const [capturedPhotoUrls, setCapturedPhotoUrls] = useState([]);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    fetchInterns();
    fetchSupervisors();
  }, []);

  const fetchInterns = async () => {
    try {
      const res = await internService.getAll();
      setInterns(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await supervisorService.getAll();
      setSupervisors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    return Math.ceil(
      Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)
    );
  };

  const inputStyle = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Use camera-captured photos if present, otherwise keep existing
      if (editingIntern) {
        if (capturedPhotos.length > 0 && capturedPhotos.length !== 5) {
          alert('Veuillez fournir exactement 5 photos lors de la mise à jour.');
          return;
        }

        if (capturedPhotos.length > 0) {
          await updateInternWithFaceData(editingIntern.id, formData, capturedPhotos);
        } else {
          await internService.update(editingIntern.id, formData);
        }
      } else {
        if (capturedPhotos.length !== 5) {
          alert('Veuillez capturer exactement 5 photos.');
          return;
        }

        await createInternWithFaceData(formData, capturedPhotos);
      }

      fetchInterns();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer ce stagiaire ?')) {
      await internService.delete(id);
      fetchInterns();
    }
  };

  const handleEdit = (intern) => {
    setEditingIntern(intern);
    setFormData(intern);
    // populate previews from existing photos
    setPhotoFiles([]);
    setPhotoPreviews([]);
    const photos = Array.isArray(intern.photos) ? intern.photos : intern.photo ? [intern.photo] : [];
    setExistingPhotoUrls(photos.map((p) => (p && (p.startsWith('http') ? p : `http://localhost:8000/storage/${p}`))));
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingIntern(null);
    setFormData({
      first_name: '',
      last_name: '',
      establishment: '',
      internship_type: 'PFE',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      duration: 0,
      supervisor_id: '',
      service: '',
      shift_id: 4,
    });
    setPhotoFiles([]);
    setPhotoPreviews([]);
  };

  const toPhotoUrl = (photoPath) => {
    if (!photoPath) return '';
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) return photoPath;
    return `http://localhost:8000/storage/${photoPath}`;
  };

  const clearCapturedPhotos = () => {
    capturedPhotoUrls.forEach((url) => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });

    setCapturedPhotos([]);
    setCapturedPhotoUrls([]);
    setCapturedPhotoDataUrls([]);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraReady(false);
  };

  const startLiveCamera = async () => {
    try {
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra non disponible');

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraError('');
      setIsCameraReady(true);
    } catch (err) {
      console.error(err);
      setCameraError('Impossible d\'accéder à la caméra.');
      setIsCameraReady(false);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const total = existingPhotoUrls.length + capturedPhotos.length;
    if (total >= 5) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return setCameraError('Impossible de capturer');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return setCameraError('Capture échouée');

      const file = new File([blob], `intern-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const preview = URL.createObjectURL(blob);

      setCapturedPhotoDataUrls((c) => [...c, dataUrl]);
      setCapturedPhotos((c) => [...c, file]);
      setCapturedPhotoUrls((c) => [...c, preview]);
    }, 'image/jpeg', 0.92);
  };

  const handleClearPhotos = () => {
    clearCapturedPhotos();
    setCameraError('');
  };

  const handleCloseModal = () => {
    stopCamera();
    setShowModal(false);
    resetForm();
  };

  const filteredInterns = interns.filter((i) =>
    `${i.first_name} ${i.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const summaryCards = [
    {
      title: 'Total stagiaires',
      value: interns.length,
      hint: 'enregistrés dans le système',
      gradient: 'from-slate-900 to-slate-700',
    },
    {
      title: 'Profils avec photos',
      value: interns.filter((intern) => Array.isArray(intern.photos) && intern.photos.length > 0).length,
      hint: 'candidats prêts pour la reconnaissance',
      gradient: 'from-sky-500 to-cyan-500',
    },
    {
      title: 'Encadrants liés',
      value: supervisors.length,
      hint: 'responsables de stage disponibles',
      gradient: 'from-emerald-500 to-teal-500',
    },
  ];

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.25),_transparent_35%)]" />
        <div className="relative p-8 md:p-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300/90">Gestion RH</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold">Stagiaires</h1>
            <p className="mt-2 max-w-2xl text-slate-300">Gestion moderne des stagiaires avec capture faciale, suivi des encadrants et informations de stage.</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Ajouter un stagiaire
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.title} className={`rounded-3xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-lg`}>
            <p className="text-sm text-white/75">{card.title}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
            <p className="mt-2 text-xs text-white/80">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Liste des stagiaires</h2>
            <p className="text-sm text-slate-500">Recherche, modification et suppression dans une interface plus claire.</p>
          </div>

          <div className="relative w-full lg:w-[360px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputStyle} pl-11 bg-slate-50 focus:bg-white`}
              placeholder="Rechercher un stagiaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Établissement</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Durée</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredInterns.length ? filteredInterns.map((i) => (
                  <tr key={i.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-bold text-white">
                          {(i.first_name?.[0] || 'I')}{(i.last_name?.[0] || '')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{i.first_name} {i.last_name}</p>
                          <p className="text-xs text-slate-500">{i.service || 'Service non défini'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{i.establishment}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{i.internship_type}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-900">{i.duration} jours</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(i)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700" title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(i.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-red-500 transition hover:border-red-200 hover:bg-red-50" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Search className="h-5 w-5" />
                        </div>
                        <p className="text-base font-semibold text-slate-900">Aucun stagiaire trouvé</p>
                        <p className="mt-2 text-sm text-slate-500">Essayez un autre mot-clé ou ajoutez un nouveau stagiaire.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="mx-auto w-full max-w-6xl">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Formulaire stagiaire</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{editingIntern ? 'Modifier le stagiaire' : 'Ajouter un stagiaire'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Informations administratives à gauche, capture faciale à droite.</p>
                </div>
                <button onClick={handleCloseModal} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Fermer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-0">
                <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8 xl:border-r xl:border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Prénom" required><input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={inputStyle} placeholder="Ex. Fatima" /></Field>
                    <Field label="Nom" required><input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={inputStyle} placeholder="Ex. Zahra" /></Field>
                  </div>

                  <Field label="Établissement" required><input value={formData.establishment} onChange={(e) => setFormData({ ...formData, establishment: e.target.value })} className={inputStyle} placeholder="Ex. FST Settat" /></Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Type de stage" required>
                      <select value={formData.internship_type} onChange={(e) => setFormData({ ...formData, internship_type: e.target.value })} className={inputStyle + ' bg-white'}>
                        <option value="PFE">PFE</option>
                        <option value="Stage d'observation">Stage d'observation</option>
                        <option value="Stage de fin d'études">Stage de fin d'études</option>
                      </select>
                    </Field>
                    <Field label="Service" required><input value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} className={inputStyle} placeholder="Ex. Développement" /></Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Date début" required>
                      <input type="date" value={formData.start_date} onChange={(e) => { const start = e.target.value; const duration = calculateDuration(start, formData.end_date); setFormData({ ...formData, start_date: start, duration }); }} className={inputStyle} />
                    </Field>
                    <Field label="Date fin" required>
                      <input type="date" value={formData.end_date} onChange={(e) => { const end = e.target.value; const duration = calculateDuration(formData.start_date, end); setFormData({ ...formData, end_date: end, duration }); }} className={inputStyle} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Durée (jours)"><input value={formData.duration} readOnly className={inputStyle + ' bg-slate-50 text-slate-700'} /></Field>
                    <Field label="Shift" required>
                      <select value={formData.shift_id} onChange={(e) => setFormData({ ...formData, shift_id: Number(e.target.value) })} className={inputStyle + ' bg-white'}>
                        <option value={1}>Matin - 08:00 / 17:00</option>
                        <option value={2}>Soir - 17:00 / 00:00</option>
                        <option value={3}>Nuit - 00:00 / 08:00</option>
                        <option value={4}>Fixe stagiaire - 08:00 / 15:00</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Encadrant" required>
                    <select value={formData.supervisor_id} onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })} className={inputStyle + ' bg-white'}>
                      <option value="">Sélectionner un encadrant</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                      ))}
                    </select>
                  </Field>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Conseil</p>
                        <p className="text-sm text-slate-500">Capturez les 5 photos via le panneau de droite avant l’enregistrement.</p>
                      </div>
                      <div className="rounded-2xl bg-sky-100 p-3 text-sky-700"><Camera className="h-5 w-5" /></div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                    <button type="button" onClick={handleCloseModal} className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Annuler</button>
                    <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5">
                      {editingIntern ? 'Modifier le stagiaire' : 'Ajouter le stagiaire'}
                    </button>
                  </div>
                </form>

                <div className="space-y-5 bg-slate-50/70 p-6 md:p-8">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Capture faciale</p>
                        <p className="text-sm text-slate-500">Prenez 5 photos nettes pour l'entraînement biométrique.</p>
                      </div>
                      <div className="rounded-2xl bg-sky-50 p-3 text-sky-600"><Camera className="h-5 w-5" /></div>
                    </div>

                    {cameraError ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{cameraError}</div> : null}

                    <div className="mt-4 overflow-hidden rounded-3xl bg-slate-950 aspect-[4/3] ring-1 ring-slate-200">
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <span>{existingPhotoUrls.length + capturedPhotos.length}/5 photos capturées</span>
                      <button type="button" onClick={handleClearPhotos} className="font-semibold text-sky-600 hover:text-sky-700">Réinitialiser</button>
                    </div>

                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const photoUrl = existingPhotoUrls[index] || capturedPhotoUrls[index];
                        return (
                          <div key={index} className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {photoUrl ? (
                              <img src={photoUrl} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-300">{index + 1}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button type="button" onClick={startLiveCamera} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Ouvrir la caméra</button>
                      <button type="button" onClick={handleCapture} disabled={!isCameraReady || existingPhotoUrls.length + capturedPhotos.length >= 5} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Capturer</button>
                    </div>

                    {capturedPhotos.length > 0 ? (
                      <button type="button" onClick={handleClearPhotos} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        <RefreshCcw size={16} />
                        Réinitialiser les captures
                      </button>
                    ) : null}

                    <p className="mt-4 text-xs leading-5 text-slate-500">Les 5 photos sont envoyées au backend avec les descripteurs faciaux lors de l’enregistrement.</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Aperçu des photos</p>
                        <p className="text-xs text-slate-500">Vérifiez le contenu avant de sauvegarder.</p>
                      </div>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">5 slots</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const photoUrl = existingPhotoUrls[index] || capturedPhotoUrls[index];
                        return (
                          <div key={index} className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {photoUrl ? (
                              <img src={photoUrl} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-300">Vide</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        {required ? <span className="text-sky-500">*</span> : null}
      </div>
      {children}
    </label>
  );
}