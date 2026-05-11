import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'attendee' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) next.name = 'Full name is required';
    else if (name.length < 2) next.name = 'Full name must be at least 2 characters';
    if (!email) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    return next;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setLoading(true);
    setSubmitError('');
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome aboard.');
      navigate('/app/dashboard');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${errors[field] ? '#ef4444' : theme.inputBorder}`,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: theme.inputBg,
    color: theme.text,
    transition: 'all 0.3s',
  });

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, transition: 'background 0.3s' }}>
      <div style={{ background: theme.surface, borderRadius: 16, padding: isMobile ? 22 : 36, width: '100%', maxWidth: 400, boxShadow: theme.modalShadow, border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: isMobile ? 28 : 36, marginBottom: 8 }}>🎪</div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 700, color: theme.text }}>Create Account</h1>
          <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: 14 }}>Join EventFlow today</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} autoComplete="name" required style={inputStyle('name')} placeholder="Jane Doe" />
            {errors.name && <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444' }}>{errors.name}</div>}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required style={inputStyle('email')} placeholder="you@example.com" />
            {errors.email && <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444' }}>{errors.email}</div>}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange} autoComplete="new-password" required style={{ ...inputStyle('password'), paddingRight: 56 }} placeholder="Min. 6 characters" />
              <button type="button" disabled={loading} onClick={() => setShowPw((prev) => !prev)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, color: theme.textFaint,
              }}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444' }}>{errors.password}</div>}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 }}>I am a...</label>
            <select name="role" value={form.role} onChange={handleChange} style={inputStyle('role')}>
              <option value="attendee">Attendee</option>
              <option value="organiser">Organiser</option>
            </select>
          </div>

          {submitError && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
              {submitError}
            </div>
          )}

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
