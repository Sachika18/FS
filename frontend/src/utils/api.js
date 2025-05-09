import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'https://fs-4mtv.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log API requests for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`API Auth: Token added to request for ${config.url}`);
    } else {
      console.warn(`API Auth: No token available for request to ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API Auth: Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.response?.status || 'Network Error'} from ${error.config?.url}`, {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      console.warn('API Auth: 401 Unauthorized - Clearing token and redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.response && error.response.status === 403) {
      console.warn('API Auth: 403 Forbidden - Possible permission issue or invalid user ID');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.get('/auth/logout')
};

// Users API
export const usersAPI = {
  getAllStudents: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  getUserByUSN: (usn) => api.get(`/users/usn/${usn}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// Attendance API
export const attendanceAPI = {
  getAllAttendance: (params) => api.get('/attendance', { params }),
  getStudentAttendance: (id) => api.get(`/attendance/student/${id}`),
  getStudentStats: (id) => api.get(`/attendance/stats/${id}`),
  markAttendance: (data) => api.post('/attendance', data),
  markBulkAttendance: (data) => api.post('/attendance/bulk', data),
  getAllAssessments: () => api.get('/attendance/assessment'),
  createAssessment: (data) => api.post('/attendance/assessment', data)
};

// Exams API
export const examsAPI = {
  getAllExams: (params) => api.get('/exams', { params }),
  getExam: (id) => api.get(`/exams/${id}`),
  createExam: (data) => api.post('/exams', data),
  updateExam: (id, data) => api.put(`/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/exams/${id}`),
  calculateEligibility: (id) => api.post(`/exams/${id}/calculate-eligibility`),
  getExamEligibility: (id) => api.get(`/exams/${id}/eligibility`),
  getStudentEligibility: (id) => api.get(`/exams/eligibility/student/${id}`)
};

export default api;