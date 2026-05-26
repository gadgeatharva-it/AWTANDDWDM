import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.resetPassword(token, { password });
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
    <div className="auth-page">
      <div className="auth-card auth-split">
        <div className="auth-left">
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-subtitle">Set a new password for your account.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>New password</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="auth-actions">
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>

          <div className="auth-links">
            <Link to="/login" className="auth-link">
              Back to login
            </Link>
          </div>
        </div>

        <div className="auth-right" aria-hidden="true">
          <img className="auth-illustration" src="/eventflow-illustration.svg" alt="" />
        </div>
      </div>
    </div>
  );
}

