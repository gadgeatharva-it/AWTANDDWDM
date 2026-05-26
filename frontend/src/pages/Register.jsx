import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee');
  const { register, loading, error } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Name, email, and password are required');
      return;
    }
    try {
      const result = await register(name, email, password, role);
      toast.success(result?.message || 'Account created. You can now log in.');
      navigate('/login', { state: { email: email.trim().toLowerCase() } });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-split">
        <div className="auth-left">
          <h1 className="auth-title">Sign up</h1>
          <p className="auth-subtitle">Create your EventFlow account</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Full Name</label>
              <input
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                placeholder="Your name"
              />
            </div>

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
                autoComplete="new-password"
                required
                placeholder="Password"
              />
            </div>

            <div className="auth-field">
              <label>Register as</label>
              <select className="auth-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="attendee">Attendee</option>
                <option value="organiser">Organiser</option>
              </select>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-actions">
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="auth-links">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>

        <div className="auth-right" aria-hidden="true">
          <img className="auth-illustration" src="/eventflow-illustration.svg" alt="" />
        </div>
      </div>
    </div>
  );
}
