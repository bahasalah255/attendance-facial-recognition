import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { computeDescriptorFromVideo, loadFaceModels } from '../../services/faceRecognition';
import { Camera, RefreshCcw, CheckCircle2, UserCheck, UserX } from 'lucide-react';

export default function Attendance() {
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [lastAction, setLastAction] = useState('check-in');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadModels();
    loadAttendance();
    startCamera();

    return () => stopCamera();
  }, []);

  const loadModels = async () => {
    try {
      await loadFaceModels();
    } catch (error) {
      console.error(error);
      setCameraError('Impossible de charger les modèles de reconnaissance faciale.');
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await api.get('/attendance');
      setAttendanceRows(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraError('');
      setCameraReady(true);
    } catch (error) {
      console.error(error);
      setCameraError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleRecognize = async () => {
    if (!videoRef.current) {
      return;
    }

    setScanning(true);
    setCameraError('');

    try {
      const descriptor = await computeDescriptorFromVideo(videoRef.current);
      const res = await api.post('/attendance/recognize', { descriptor: JSON.stringify(descriptor) });
      setRecognitionResult(res.data);
    } catch (error) {
      console.error(error);
      const apiErrors = error?.response?.data?.errors;
      setRecognitionResult(null);
      setCameraError(Object.values(apiErrors || {}).flat().join('\n') || error?.response?.data?.message || error.message || 'Échec de la reconnaissance.');
    } finally {
      setScanning(false);
    }
  };

  const handleAction = async (action) => {
    if (!recognitionResult?.user) {
      return;
    }

    try {
      if (action === 'check-in') {
        await api.post('/attendance/check-in', {
          user_type: recognitionResult.user.type.includes('Employee') ? 'employee' : 'intern',
          user_id: recognitionResult.user.id,
        });
      } else {
        await api.post('/attendance/check-out', {
          user_type: recognitionResult.user.type.includes('Employee') ? 'employee' : 'intern',
          user_id: recognitionResult.user.id,
        });
      }

      setLastAction(action);
      setRecognitionResult(null);
      await loadAttendance();
    } catch (error) {
      console.error(error);
      alert(Object.values(error?.response?.data?.errors || {}).flat().join('\n') || 'Impossible d\'enregistrer le pointage');
    }
  };

  const formatMinutes = (minutes) => {
    if (minutes === null || minutes === undefined) {
      return '-';
    }

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return `${hours}h${String(remaining).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pointage par reconnaissance faciale</h1>
          <p className="text-sm text-gray-500 mt-1">Scanne un visage, identifie la personne, puis valide son entrée ou sa sortie.</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Caméra</p>
              <p className="text-sm text-gray-500">Le visage doit être bien centré et éclairé.</p>
            </div>
            <Camera className="text-blue-600" />
          </div>

          {cameraError ? <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm whitespace-pre-line">{cameraError}</div> : null}

          <div className="overflow-hidden rounded-xl bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={startCamera} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium">
              Ouvrir la caméra
            </button>
            <button type="button" onClick={handleRecognize} disabled={!cameraReady || scanning} className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {scanning ? 'Analyse...' : 'Reconnaître'}
            </button>
          </div>
        </div>

        {recognitionResult ? (
          <div className="bg-white rounded-2xl shadow p-5 border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">Visage reconnu</p>
                <p className="text-sm text-gray-500">Confiance: {recognitionResult.confidence}%</p>
              </div>
            </div>

            <div className="rounded-xl bg-green-50 p-4 mb-4">
              <p className="text-sm text-green-700">{recognitionResult.user.name}</p>
              <p className="font-semibold text-green-900">{recognitionResult.user.matricule || 'Sans matricule'}</p>
              <p className="text-sm text-green-700">{recognitionResult.user.department || 'Département non renseigné'}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleAction('check-in')}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium flex items-center justify-center gap-2"
              >
                <UserCheck size={18} />
                Check-In
              </button>
              <button
                type="button"
                onClick={() => handleAction('check-out')}
                className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-white font-medium flex items-center justify-center gap-2"
              >
                <UserX size={18} />
                Check-Out
              </button>
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Dernière action</p>
              <p className="text-sm text-gray-500">{lastAction === 'check-in' ? 'Entrée' : 'Sortie'}</p>
            </div>
            <button type="button" onClick={startCamera} className="text-blue-600 text-sm flex items-center gap-2">
              <RefreshCcw size={14} />
              Relancer
            </button>
          </div>
          <p className="text-sm text-gray-600">Après reconnaissance, valide l'opération avec le bouton correspondant. L'enregistrement est limité à une ligne par jour et par personne.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Présences d'aujourd'hui</h2>
            <p className="text-sm text-gray-500">Employés et stagiaires pointés ce jour.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Entrée</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sortie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Durée</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{row.user_name}</div>
                    <div className="text-xs text-gray-500">{row.matricule || row.user_type}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{row.check_in || '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.check_out || '-'}</td>
                  <td className="px-4 py-3 text-sm">{formatMinutes(row.total_hours)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 capitalize">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!attendanceRows.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan="5">
                    Aucune présence enregistrée pour aujourd'hui.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
