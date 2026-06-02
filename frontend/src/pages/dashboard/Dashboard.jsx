import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await dashboardService.getStats();
      setStats(res.data);
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
  ];

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Bienvenue, {admin.name} !</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Présences aujourd'hui</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Présents</span>
              <span className="text-2xl font-bold text-green-600">{stats?.present_today || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Retards</span>
              <span className="text-2xl font-bold text-orange-600">{stats?.late_today || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Absences</span>
              <span className="text-2xl font-bold text-red-600">{stats?.absent_today || 0}</span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taux de présence</span>
                <span className="text-2xl font-bold text-blue-600">{stats?.attendance_rate || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Anomalies en attente</h3>
          <div className="text-center py-8">
            <div className="text-6xl mb-3">⚠️</div>
            <p className="text-3xl font-bold text-gray-800">{stats?.pending_anomalies || 0}</p>
            <p className="text-gray-500 mt-2">anomalies non résolues</p>
          </div>
        </div>
      </div>
    </div>
  );
}
