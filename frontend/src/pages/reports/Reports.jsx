import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

export default function Reports() {
  const [from, setFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const res = await api.get('/reports', { params: { from, to } });
      setReport(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (type) => {
    const response = type === 'pdf'
      ? await api.get('/reports/pdf', { params: { from, to }, responseType: 'blob' })
      : await api.get('/reports/excel', { params: { from, to }, responseType: 'blob' });

    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = type === 'pdf' ? 'rapport-attendance.pdf' : 'rapport-attendance.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFilter = async (e) => {
    e.preventDefault();
    await loadReport();
  };

  if (loading) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  const summary = report?.summary || {};
  const attendances = report?.attendances || [];

  const cards = [
    { label: 'Total', value: summary.total || 0, color: 'from-blue-500 to-blue-600' },
    { label: 'Présents', value: summary.present || 0, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Retards', value: summary.late || 0, color: 'from-orange-500 to-orange-600' },
    { label: 'Absences', value: summary.absent || 0, color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports de présence</h1>
        <p className="text-sm text-gray-500 mt-1">Filtre, exporte et consulte les présences sur une période donnée.</p>
      </div>

      <form onSubmit={handleFilter} className="bg-white rounded-2xl shadow p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Du</label>
          <input type="date" className="w-full border rounded-lg px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Au</label>
          <input type="date" className="w-full border rounded-lg px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button type="submit" className="rounded-lg bg-gray-900 text-white px-4 py-2 font-medium">Appliquer</button>
        <div className="flex gap-2">
          <button type="button" onClick={() => downloadFile('pdf')} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium">
            <FileText size={16} /> PDF
          </button>
          <button type="button" onClick={() => downloadFile('excel')} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium">
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow p-5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} mb-3`} />
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-5 border-b flex items-center gap-2">
          <Download size={18} className="text-blue-600" />
          <h2 className="text-lg font-semibold">Détail des pointages</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Entrée</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sortie</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendances.map((attendance) => (
              <tr key={attendance.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{attendance.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{attendance.type}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{attendance.date}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{attendance.check_in || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{attendance.check_out || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{attendance.status}</td>
              </tr>
            ))}
            {!attendances.length ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan="6">Aucune donnée pour cette période.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
