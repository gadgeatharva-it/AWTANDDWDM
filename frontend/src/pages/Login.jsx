import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Prefill email after register / other flows.
  useEffect(() => {
    const prefill = location.state?.email;
    if (typeof prefill === 'string' && prefill.trim()) setEmail(prefill.trim());
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email and password are required');
      return;
    }
    try {
      const loggedInUser = await login(email, password);
      const firstName = loggedInUser?.name?.split(' ')?.[0] || loggedInUser?.name || '';
      toast.success(`Welcome, ${firstName}!`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-split">
        <div className="auth-left">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Welcome back to EventFlow</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="Your email"
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Password"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-actions">
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="auth-links">
            Don&apos;t have an account? <Link to="/register" className="auth-link">Register</Link>
          </div>

          <div className="auth-links" style={{ marginTop: 10 }}>
            <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
          </div>
        </div>

        <div className="auth-right" aria-hidden="true">
          <img className="auth-illustration" src="/eventflow-illustration.svg" alt="" />
        </div>
      </div>
    </div>
  );
}
