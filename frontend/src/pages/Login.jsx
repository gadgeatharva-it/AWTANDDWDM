import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();

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

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.inputBorder}`,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: theme.inputBg,
    color: theme.text,
    transition: 'all 0.3s',
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, transition: 'background 0.3s' }}>
      <div style={{ background: theme.surface, borderRadius: 16, padding: isMobile ? 22 : 36, width: '100%', maxWidth: 400, boxShadow: theme.modalShadow, border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/event-icon.svg" alt="Event icon" width="52" height="52" style={{ display: 'block', margin: '0 auto 10px' }} />
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 700, color: theme.text }}>EventFlow</h1>
          <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: 14 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required style={inputStyle} placeholder="you@example.com" />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required style={inputStyle} placeholder="Password" />
          </div>

          {error && <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
            background: loading ? '#a5b4fc' : '#6366f1', color: '#fff',
            fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: theme.textMuted }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
          <Link to="/forgot-password" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
