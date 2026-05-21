import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading, error } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Name, email, and password are required');
      return;
    }
    try {
      const newUser = await register(name, email, password, 'attendee');
      const firstName = newUser?.name?.split(' ')?.[0] || newUser?.name || '';
      toast.success(`Welcome, ${firstName}!`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
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
      <div style={{ background: theme.surface, borderRadius: 16, padding: isMobile ? 22 : 36, width: '100%', maxWidth: 420, boxShadow: theme.modalShadow, border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/event-icon.svg" alt="Event icon" width="52" height="52" style={{ display: 'block', margin: '0 auto 10px' }} />
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 700, color: theme.text }}>Create Account</h1>
          <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: 14 }}>Join EventFlow</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required style={inputStyle} placeholder="Jane Doe" />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required style={inputStyle} placeholder="you@example.com" />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required style={inputStyle} placeholder="Min. 6 characters" />
          </div>

          {error && <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
            background: loading ? '#a5b4fc' : '#6366f1', color: '#fff',
            fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
          }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: theme.textMuted }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
