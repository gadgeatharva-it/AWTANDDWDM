import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword({
        email: email.trim().toLowerCase(),
      });
      toast.success(
        data?.message ||
          'If the account exists, a reset email has been sent.'
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-split">
        <div className="auth-left">
          <h1 className="auth-title">Forgot password</h1>
          <p className="auth-subtitle">We&apos;ll email you a reset link.</p>

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

            <div className="auth-actions">
              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link'}
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
          <img
            className="auth-illustration"
            src="/eventflow-illustration.svg"
            alt=""
          />
        </div>
      </div>
    </div>
  );
}
