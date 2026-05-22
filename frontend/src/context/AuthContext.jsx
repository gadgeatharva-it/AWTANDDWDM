import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';

const AuthContext = createContext();
const NETWORK_ERROR = `Unable to reach the server. Check backend + API URL (currently: ${API_BASE_URL}).`;
const BAD_API_TARGET_ERROR =
  `Login API not found at ${API_BASE_URL}. Set REACT_APP_API_BASE_URL to your backend (e.g. https://your-backend.onrender.com or http://localhost:5000/api). If deployed on Netlify, add the env var in Site settings and trigger a new deploy (CRA env vars are baked in at build time). For local dev, you can also run the frontend with \`npm start\` from \`frontend\`.`;

function looksLikeHtml(data) {
  return typeof data === 'string' && /<!doctype html>|<html[\s>]/i.test(data);
}

function getAuthErrorMessage(err, fallback) {
  if (!err.response) return NETWORK_ERROR;

  const data = err.response.data;
  if (looksLikeHtml(data)) return BAD_API_TARGET_ERROR;
  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0].msg || data.errors[0].message || fallback;
  }

  return fallback;
}

function clearSavedAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function readSavedAuth() {
  const rawToken = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');
  if (!rawToken || !rawUser) return null;
  try {
    const user = JSON.parse(rawUser);
    if (!user?.id) return null;
    return { token: rawToken, user };
  } catch {
    return null;
  }
}

function saveAuth({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setSession = useCallback(({ token, user }) => {
    if (!token || !user) return;
    saveAuth({ token, user });
    setUser(user);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const saved = readSavedAuth();
      if (!saved?.token || !saved?.user) {
        if (!cancelled) setInitializing(false);
        return;
      }

      // Verify token/user with backend so a stale token doesn't keep the UI "logged in" after refresh.
      try {
        const { data } = await authService.getMe();
        if (!cancelled) setUser(data?.user || saved.user);
      } catch {
        clearSavedAuth();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      setSession({ token: data.token, user: data.user });
      return data.user;
    } catch (err) {
      const msg = getAuthErrorMessage(err, 'Login failed');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setSession]);

  const register = useCallback(async (name, email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      if (data?.token && data?.user) {
        setSession({ token: data.token, user: data.user });
      }
      return data;
    } catch (err) {
      const msg = getAuthErrorMessage(err, 'Registration failed');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    clearSavedAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, loading, error, login, register, logout, setSession, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
