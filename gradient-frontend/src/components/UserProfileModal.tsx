import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGradient } from '../context/GradientContext';
import { UserIcon, ShieldIcon, SunIcon, MoonIcon, LogoutIcon } from './Icons';

interface UserProfileModalProps {
  readonly onClose: () => void;
}

export function UserProfileModal({ onClose }: UserProfileModalProps): JSX.Element {
  const { username, displayName, email, role, theme, toggleTheme, logout } = useGradient();
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleLogout = (): void => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <>
      {/* Invisible full-page backdrop — clicking outside closes the dropdown */}
      <div
        className="profile-dropdown-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown panel */}
      <div className="user-profile-dropdown" role="dialog" aria-label="User profile menu">
        {/* Header */}
        <div className="profile-dropdown-header">
          <div className="profile-avatar">
            {role === 'admin' ? <ShieldIcon size={20} /> : <UserIcon size={20} />}
          </div>
          <div className="profile-info">
            <span className="profile-display-name">{displayName || username}</span>
            <span className="profile-username">@{username}</span>
            {email && <span className="profile-email">{email}</span>}
          </div>
          <span className={`profile-role-badge ${role === 'admin' ? 'badge-admin' : 'badge-student'}`}>
            {role === 'admin' ? 'Admin' : 'Student'}
          </span>
        </div>

        {/* Appearance */}
        <div className="profile-dropdown-section">
          <span className="profile-section-label">Appearance</span>
          <button type="button" className="profile-menu-item" onClick={toggleTheme}>
            {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
            <span className="profile-menu-item-value">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        <div className="profile-dropdown-divider" />

        {/* Sign out */}
        <div className="profile-dropdown-section">
          <button
            type="button"
            className="profile-menu-item profile-menu-item-danger"
            onClick={handleLogout}
          >
            <LogoutIcon size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
