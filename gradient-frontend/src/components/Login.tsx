import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGradient } from '../context/GradientContext';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from './Icons';

export function Login(): JSX.Element {
  const { login } = useGradient();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/problems');
    } catch (err: any) {
      setError(err.message || 'Invalid username/email or password.');
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
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Login to access your sandboxed compiler workspace</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-username" className="form-label">Username or Email</label>
            <div className="input-icon-wrapper">
              <UserIcon size={16} className="input-inner-icon" />
              <input
                id="auth-username"
                type="text"
                className="form-control form-control-with-icon"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. student_master"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password" className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <LockIcon size={16} className="input-inner-icon" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-with-icon form-control-with-password-toggle"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-block ${loading ? 'loading-btn' : ''}`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}
