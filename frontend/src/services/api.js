import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Service
export const authService = {
  login: (email, password) => api.post('/login', { email, password }),
  logout: () => api.post('/logout'),
};

// Employee Service
export const employeeService = {
  getAll: () => api.get('/employees'),
  getOne: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// Intern Service
export const internService = {
  getAll: () => api.get('/interns'),
  getOne: (id) => api.get(`/interns/${id}`),
  create: (data) => api.post('/interns', data),
  update: (id, data) => api.put(`/interns/${id}`, data),
  delete: (id) => api.delete(`/interns/${id}`),
};

// Supervisor Service
export const supervisorService = {
  getAll: () => api.get('/supervisors'),
  getOne: (id) => api.get(`/supervisors/${id}`),
  create: (data) => api.post('/supervisors', data),
  update: (id, data) => api.put(`/supervisors/${id}`, data),
  delete: (id) => api.delete(`/supervisors/${id}`),
};

// Dashboard Service
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getWeekly: () => api.get('/dashboard/weekly'),
  getRepartition: () => api.get('/dashboard/repartition'),
  getAnomalies: () => api.get('/dashboard/anomalies'),
  getTopLate: () => api.get('/dashboard/top-late'),
};

// Default export
export default api;
