import { useState, useEffect } from 'react';
import { internService, supervisorService } from '../../services/api';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingIntern) {
        await internService.update(editingIntern.id, formData);
      } else {
        await internService.create(formData);
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
  };

  const filteredInterns = interns.filter((i) =>
    `${i.first_name} ${i.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Interns</h1>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          <Plus className="inline w-4 h-4 mr-1" />
          Add
        </button>
      </div>

      {/* Search */}
      <input
        className="border p-2 w-full mb-4"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Table */}
      <table className="w-full border">
        <thead>
          <tr>
            <th>Name</th>
            <th>Establishment</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredInterns.map((i) => (
            <tr key={i.id}>
              <td>{i.first_name} {i.last_name}</td>
              <td>{i.establishment}</td>
              <td>{i.internship_type}</td>
              <td>{i.duration}</td>
              <td>
                <button onClick={() => handleEdit(i)}>
                  <Pencil className="w-4 h-4" />
                </button>

                <button onClick={() => handleDelete(i.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 w-[400px]">
            <div className="flex justify-between mb-4">
              <h2>{editingIntern ? 'Edit' : 'Add'}</h2>
              <X onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                placeholder="First name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="border p-2 w-full"
              />

              <input
                placeholder="Last name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="border p-2 w-full"
              />

              <button className="bg-blue-600 text-white px-4 py-2 w-full">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}