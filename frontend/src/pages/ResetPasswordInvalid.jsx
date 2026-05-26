import { Link } from 'react-router-dom';

export default function ResetPasswordInvalid() {
  return (
    <div className="auth-page">
      <div className="auth-card auth-split">
        <div className="auth-left">
          <h1 className="auth-title">Invalid reset link</h1>
          <p className="auth-subtitle">
            This password reset link is missing the token. Please request a new reset email.
          </p>

          <div className="auth-links" style={{ marginTop: 8 }}>
            <Link to="/forgot-password" className="auth-link">
              Request new reset email
            </Link>
          </div>

          <div className="auth-links" style={{ marginTop: 10 }}>
            <Link to="/login" className="auth-link-muted">
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

