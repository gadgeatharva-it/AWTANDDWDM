import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword({ email: email.trim().toLowerCase() });
      toast.success(data?.message || 'If the account exists, a reset email has been sent.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, transition: 'background 0.3s' }}>
      <div style={{ background: theme.surface, borderRadius: 16, padding: isMobile ? 22 : 36, width: '100%', maxWidth: 420, boxShadow: theme.modalShadow, border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 700, color: theme.text }}>Forgot Password</h1>
          <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: 14 }}>We’ll email you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required style={inputStyle} placeholder="you@example.com" />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
            background: loading ? '#a5b4fc' : '#6366f1', color: '#fff',
            fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
          }}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: theme.textMuted }}>
          <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
}

