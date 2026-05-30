import axios from 'axios';

function normalizeApiBaseUrl(value) {
  if (!value) return '';

  const trimmed = String(value).trim().replace(/\/+$/, '');

  // If the user provides an absolute backend origin like `https://x.onrender.com`
  // (common when first deploying), automatically target the API prefix.
  if (/^https?:\/\//i.test(trimmed) && !/\/api$/i.test(trimmed)) {
    return `${trimmed}/api`;
  }

  return trimmed;
}

function getDefaultApiBaseUrl() {
  // CRA dev server uses package.json "proxy" so relative `/api` works.
  if (process.env.NODE_ENV === 'development') return '/api';

  // In production builds, fall back to same-origin `/api` if present,
  // otherwise (common local setup) hit the backend on :5000.
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:5000/api`;
    }
  }

  return '/api';
}

export const API_BASE_URL =
  normalizeApiBaseUrl(process.env.REACT_APP_API_BASE_URL) || getDefaultApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function clearSavedAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthRoute) {
      clearSavedAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
