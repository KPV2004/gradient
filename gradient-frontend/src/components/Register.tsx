import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGradient } from '../context/GradientContext';
import { UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from './Icons';

export function Register(): JSX.Element {
  const { register } = useGradient();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !displayName.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
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
      <div className="auth-card card register-card">
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
            <div className="input-icon-wrapper">
              <UserIcon size={16} className="input-inner-icon" />
              <input
                id="reg-fullname"
                type="text"
                className="form-control form-control-with-icon"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Master Coder"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <div className="input-icon-wrapper">
              <MailIcon size={16} className="input-inner-icon" />
              <input
                id="reg-email"
                type="email"
                className="form-control form-control-with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@domain.com"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-username" className="form-label">Username</label>
            <div className="input-icon-wrapper">
              <UserIcon size={16} className="input-inner-icon" />
              <input
                id="reg-username"
                type="text"
                className="form-control form-control-with-icon"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. master_coder"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="input-icon-wrapper">
                <LockIcon size={16} className="input-inner-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-control-with-icon form-control-with-password-toggle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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

            <div className="form-group">
              <label htmlFor="reg-confirm-password" className="form-label">Confirm Password</label>
              <div className="input-icon-wrapper">
                <LockIcon size={16} className="input-inner-icon" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control form-control-with-icon form-control-with-password-toggle"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>
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
