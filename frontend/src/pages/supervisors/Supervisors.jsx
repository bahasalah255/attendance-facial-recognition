import { useEffect, useRef, useState } from 'react';
import { supervisorService } from '../../services/api';
import { createSupervisorWithFaceData, updateSupervisorWithFaceData, computeDescriptorsFromFiles, loadFaceModels } from '../../services/faceRecognition';
import { Camera, Plus, Pencil, RefreshCcw, Search, Trash2, X } from 'lucide-react';

const inputStyle = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

export default function Supervisors() {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', department: '' });
  const [cameraError, setCameraError] = useState('');
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [capturedPhotoDataUrls, setCapturedPhotoDataUrls] = useState([]);
  const [capturedPhotoUrls, setCapturedPhotoUrls] = useState([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadSupervisors();
  }, []);

  useEffect(() => {
    loadFaceModels().catch((e) => console.error('Erreur chargement modèles visage:', e));
  }, []);

  const loadSupervisors = async () => {
    try {
      const res = await supervisorService.getAll();
      setSupervisors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toPhotoUrl = (p) => {
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `http://localhost:8000/storage/${p}`;
  };

  const clearCapturedPhotos = () => {
    capturedPhotoUrls.forEach((url) => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); });
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
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
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
      const file = new File([blob], `supervisor-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const preview = URL.createObjectURL(blob);
      setCapturedPhotoDataUrls((c) => [...c, dataUrl]);
      setCapturedPhotos((c) => [...c, file]);
      setCapturedPhotoUrls((c) => [...c, preview]);
    }, 'image/jpeg', 0.92);
  };

  const handleClearPhotos = () => { clearCapturedPhotos(); setCameraError(''); };

  const resetForm = () => {
    setEditingSupervisor(null);
    setFormData({ first_name: '', last_name: '', email: '', phone: '', department: '' });
    clearCapturedPhotos();
    setExistingPhotoUrls([]);
  };

  const handleCloseModal = () => { stopCamera(); setShowModal(false); resetForm(); };

  const handleEdit = (s) => {
    setEditingSupervisor(s);
    setFormData({ first_name: s.first_name, last_name: s.last_name, email: s.email, phone: s.phone, department: s.department });
    clearCapturedPhotos();
    const photos = Array.isArray(s.photos) ? s.photos : s.photo ? [s.photo] : [];
    setExistingPhotoUrls(photos.map((p) => toPhotoUrl(p)));
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet encadrant ?')) return;
    try { await supervisorService.delete(id); await loadSupervisors(); } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = existingPhotoUrls.length + capturedPhotos.length;
      if (!editingSupervisor && capturedPhotoDataUrls.length !== 5) { alert('Veuillez capturer exactement 5 photos.'); return; }
      if (editingSupervisor && capturedPhotos.length > 0 && total !== 5) { alert('Veuillez fournir exactement 5 photos lors de la mise à jour.'); return; }

      const payload = { ...formData, photos: capturedPhotoDataUrls };
      if (capturedPhotos.length > 0) {
        const faceDescriptors = await computeDescriptorsFromFiles(capturedPhotos);
        payload.face_descriptors = faceDescriptors;
      }

      if (editingSupervisor) {
        await supervisorService.update(editingSupervisor.id, payload);
      } else {
        await supervisorService.create(payload);
      }

      await loadSupervisors();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      const apiErrors = err?.response?.data?.errors;
      alert(Object.values(apiErrors || {}).flat().join('\n') || 'Erreur lors de l\'enregistrement');
    }
  };

  const filtered = supervisors.filter((s) => {
    const q = searchTerm.toLowerCase();
    return [s.first_name, s.last_name, s.email, s.phone, s.department].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  });

  const totalPhotos = existingPhotoUrls.length + capturedPhotos.length;
  const allPhotoUrls = [...existingPhotoUrls, ...capturedPhotoUrls];

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.25),_transparent_35%)]" />
        <div className="relative flex flex-col gap-6 p-8 md:p-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300/90">Gestion RH</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Encadrants</h1>
            <p className="mt-2 max-w-2xl text-slate-300">Gestion des encadrants avec profils faciaux pour la correspondance.</p>
          </div>

          <button onClick={() => { resetForm(); setShowModal(true); }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5">
            <Plus className="h-4 w-4" /> Ajouter un encadrant
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Liste des encadrants</h2>
            <p className="text-sm text-slate-500">Ajoutez, modifiez ou supprimez les encadrants.</p>
          </div>

          <div className="relative w-full lg:w-[360px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={inputStyle + ' bg-slate-50 pl-11 focus:bg-white'} placeholder="Rechercher un encadrant..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Téléphone</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Département</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.length ? filtered.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-bold text-white">{(s.first_name?.[0] || 'E')}{(s.last_name?.[0]||'')}</div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.full_name || `${s.first_name} ${s.last_name}`}</p>
                          <p className="text-xs text-slate-500">{s.department || 'Département non défini'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{s.email}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{s.phone}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{s.department}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(s)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700" title="Modifier"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-red-500 transition hover:border-red-200 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Search className="h-5 w-5" /></div>
                        <p className="text-base font-semibold text-slate-900">Aucun encadrant trouvé</p>
                        <p className="mt-2 text-sm text-slate-500">Essayez un autre mot-clé ou ajoutez un nouvel encadrant.</p>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-6xl">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Formulaire encadrant</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{editingSupervisor ? 'Modifier l’encadrant' : 'Ajouter un encadrant'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Informations à gauche, capture faciale à droite.</p>
                </div>
                <button onClick={handleCloseModal} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Fermer"><X className="h-5 w-5" /></button>
              </div>

              <div className="grid grid-cols-1 gap-0 xl:grid-cols-[1.1fr_0.9fr]">
                <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8 xl:border-r xl:border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Prénom</label>
                      <input className="w-full border rounded-lg px-3 py-2" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom</label>
                      <input className="w-full border rounded-lg px-3 py-2" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" className="w-full border rounded-lg px-3 py-2" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Téléphone</label>
                      <input className="w-full border rounded-lg px-3 py-2" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Département</label>
                      <input className="w-full border rounded-lg px-3 py-2" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={handleCloseModal} className="flex-1 border rounded-lg py-2">Annuler</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2">{editingSupervisor ? 'Modifier' : 'Ajouter'}</button>
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
                      <span>{totalPhotos}/5 photos capturées</span>
                      <button type="button" onClick={handleClearPhotos} className="font-semibold text-sky-600 hover:text-sky-700">Réinitialiser</button>
                    </div>

                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const photoUrl = allPhotoUrls[index];
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
                      <button type="button" onClick={handleCapture} disabled={!isCameraReady || totalPhotos >= 5} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Capturer</button>
                    </div>

                    {capturedPhotos.length > 0 ? (
                      <button type="button" onClick={handleClearPhotos} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><RefreshCcw size={16} /> Réinitialiser les captures</button>
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
                        const photoUrl = allPhotoUrls[index];
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