import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const cleanBaseUrl = rawUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: ${cleanBaseUrl}/api,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = Bearer ;
  }
  return config;
});

export default api;
