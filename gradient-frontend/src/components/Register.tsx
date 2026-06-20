import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGradient } from '../context/GradientContext';

export function Register(): JSX.Element {
  const { register } = useGradient();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim() || !displayName.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await register(username, email, password, displayName, role);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try changing username or email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <span className="auth-logo-text">GRADIENT</span>
          </div>
          <h2>Create account</h2>
          <p className="auth-subtitle">Get started with Gradient coding platform</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-success-banner">
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-fullname" className="form-label">Full Name</label>
            <input
              id="reg-fullname"
              type="text"
              className="form-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Master Coder"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-username" className="form-label">Username</label>
            <input
              id="reg-username"
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. master_coder"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@domain.com"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <input
              id="reg-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-role" className="form-label">Register As</label>
            <select
              id="reg-role"
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="student">Student (Regular User)</option>
              <option value="admin">Teacher / Instructor (Admin)</option>
            </select>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-block ${loading ? 'loading-btn' : ''}`}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log In</Link></p>
        </div>
      </div>
    </div>
  );
}
