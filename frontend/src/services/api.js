import axios from 'axios';

const API_BASE_URL = 'https://student-feedback-5vha.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edu_feedback_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking login credentials
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('edu_feedback_token');
        localStorage.removeItem('edu_feedback_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (studentData) => api.post('/auth/register', studentData),
  getMe: () => api.get('/auth/me')
};

export const metadataApi = {
  getDepartments: () => api.get('/metadata/departments'),
  getSubjects: (params) => api.get('/metadata/subjects', { params }),
  getFaculty: (params) => api.get('/metadata/faculty', { params }),
  getSettings: () => api.get('/metadata/settings')
};

export const studentApi = {
  getDashboard: () => api.get('/student/dashboard-summary'),
  submitFeedback: (feedbackData) => api.post('/student/feedback', feedbackData),
  getHistory: () => api.get('/student/feedback-history'),
  updateFeedback: (id, data) => api.put(`/student/feedback/${id}`, data),
  deleteFeedback: (id) => api.delete(`/student/feedback/${id}`)
};

export const facultyApi = {
  getDashboard: () => api.get('/faculty/dashboard'),
  getFeedback: (params) => api.get('/faculty/feedback', { params })
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (userData) => api.post('/admin/users', userData),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  getSubjects: () => api.get('/admin/subjects'),
  createSubject: (data) => api.post('/admin/subjects', data),
  assignFaculty: (data) => api.post('/admin/assign-faculty', data),
  getFeedback: (params) => api.get('/admin/feedback', { params }),
  updateFeedbackStatus: (id, status) => api.put(`/admin/feedback/${id}/status`, { status }),
  deleteFeedback: (id) => api.delete(`/admin/feedback/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  exportReportUrl: (format) => `${API_BASE_URL}/admin/export?format=${format}`
};

export default api;
