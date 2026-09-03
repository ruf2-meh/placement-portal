import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust port if needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the logged-in user's JWT to every outgoing request, if one exists.
// Without this, any route protected by authMiddleware.js (e.g. /auth/me)
// gets called with no Authorization header at all and correctly rejects
// with 401 "No token provided."
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;