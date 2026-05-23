import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request'); // request | reset
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const inputStyle = useMemo(
    () => ({
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
    }),
    [theme.inputBorder, theme.inputBg, theme.text]
  );

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword({ email: email.trim().toLowerCase() });
      toast.success(data?.message || 'If the account exists, a reset code has been sent.');
      setStep('reset');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.replace(/\\s+/g, '');

    if (!cleanEmail) {
      toast.error('Email is required');
      return;
    }
    if (!/^\\d{6}$/.test(cleanOtp)) {
      toast.error('Enter the 6-digit code');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.resetPassword({ email: cleanEmail, otp: cleanOtp, password });
      if (data?.token && data?.user) setSession({ token: data.token, user: data.user });
      toast.success(data?.message || 'Password reset successful.');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, transition: 'background 0.3s' }}>
      <div style={{ background: theme.surface, borderRadius: 16, padding: isMobile ? 22 : 36, width: '100%', maxWidth: 420, boxShadow: theme.modalShadow, border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 700, color: theme.text }}>Forgot Password</h1>
          <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: 14 }}>
            {step === 'request' ? "We'll email you a 6-digit reset code." : 'Enter the code from your email and set a new password.'}
          </p>
        </div>

        <form onSubmit={step === 'request' ? handleRequestOtp : handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required style={inputStyle} placeholder="you@example.com" disabled={loading || step === 'reset'} />
          </div>

          {step === 'reset' && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Reset code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\\d{6}"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                  required
                  style={inputStyle}
                  placeholder="6-digit code"
                  disabled={loading}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required style={inputStyle} placeholder="Min. 6 characters" disabled={loading} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required style={inputStyle} placeholder="Re-enter password" disabled={loading} />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
            background: loading ? '#a5b4fc' : '#6366f1', color: '#fff',
            fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
          }}>
            {step === 'request' ? (loading ? 'Sending...' : 'Send reset code') : (loading ? 'Updating...' : 'Update password')}
          </button>
        </form>

        {step === 'reset' && (
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: theme.textMuted }}>
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setOtp('');
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={loading}
              style={{ background: 'transparent', border: 'none', color: '#6366f1', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              Use a different email
            </button>
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: theme.textMuted }}>
          <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
}
