import { useState, useEffect } from 'react';
import { employeeService } from '../../services/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await employeeService.getAll();
      setEmployees(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, formData);
      } else {
        await employeeService.create(formData);
      }
      loadEmployees();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer cet employé ?')) {
      try {
        await employeeService.delete(id);
        loadEmployees();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      position: employee.position,
      department: employee.department,
      hire_date: employee.hire_date,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      full_name: '',
      position: '',
      department: '',
      hire_date: new Date().toISOString().split('T')[0],
    });
  };

  if (loading) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Employés</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Ajouter un employé
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Matricule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Nom complet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Poste</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Département</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{emp.matricule}</td>
                <td className="px-6 py-4 text-sm">{emp.full_name}</td>
                <td className="px-6 py-4 text-sm">{emp.position}</td>
                <td className="px-6 py-4 text-sm">{emp.department}</td>
                <td className="px-6 py-4 text-sm">
                  <button onClick={() => handleEdit(emp)} className="text-blue-600 mr-2">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="text-red-600">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingEmployee ? 'Modifier' : 'Ajouter'} un employé
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom complet</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Poste</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Département</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'embauche</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2">
                  Annuler
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2">
                  {editingEmployee ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
