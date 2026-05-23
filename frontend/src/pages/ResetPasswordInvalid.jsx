import { Link } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

export default function ResetPasswordInvalid() {
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, transition: 'background 0.3s' }}>
      <div style={{ background: theme.surface, borderRadius: 16, padding: isMobile ? 22 : 36, width: '100%', maxWidth: 420, boxShadow: theme.modalShadow, border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 700, color: theme.text }}>Password reset link not supported</h1>
          <p style={{ margin: '10px 0 0', color: theme.textMuted, fontSize: 14 }}>
            Password reset now uses a one-time code (OTP) instead of a link. Please request a reset code and continue from there.
          </p>
          <p style={{ margin: '14px 0 0', fontSize: 14 }}>
            <Link to="/forgot-password" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Request reset code</Link>
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 14 }}>
            <Link to="/login" style={{ color: theme.textMuted, textDecoration: 'none' }}>Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
