import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();
const NETWORK_ERROR = 'Unable to reach the server. Please make sure the backend is running on port 5000.';

function getAuthErrorMessage(err, fallback) {
  if (!err.response) return NETWORK_ERROR;

  const data = err.response.data;
  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0].msg || data.errors[0].message || fallback;
  }

  return fallback;
}

function clearSavedAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    clearSavedAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = getAuthErrorMessage(err, 'Login failed');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

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
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = getAuthErrorMessage(err, 'Registration failed');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSavedAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
