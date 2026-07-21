import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('userInfo');
      // Optionally redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH API CALLS ============
export const loginUser = (email, password) => {
  return api.post('/users/login', { email, password });
};

export const registerUser = (name, email, password) => {
  return api.post('/users/register', { name, email, password });
};

export const getUserProfile = () => {
  return api.get('/users/profile');
};

export const updateUserProfile = (userData) => {
  return api.put('/users/profile', userData);
};

// ============ NOTES API CALLS ============
export const getNotes = () => {
  return api.get('/notes');
};

export const getNoteById = (id) => {
  return api.get(`/notes/${id}`);
};

export const createNote = (data) => {
  return api.post('/notes', data);
};

export const updateNote = (id, data) => {
  return api.put(`/notes/${id}`, data);
};

export const deleteNote = (id) => {
  return api.delete(`/notes/${id}`);
};

export default api;