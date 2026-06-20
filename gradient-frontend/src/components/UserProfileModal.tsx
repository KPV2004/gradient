import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGradient } from '../context/GradientContext';
import { CloseIcon, UserIcon, ShieldIcon, SunIcon, MoonIcon, LogoutIcon } from './Icons';

interface UserProfileModalProps {
  readonly onClose: () => void;
}

export function UserProfileModal({ onClose }: UserProfileModalProps): JSX.Element {
  const { username, displayName, email, role, theme, toggleTheme, logout } = useGradient();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleLogout = (): void => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <div className="user-profile-dropdown" ref={modalRef}>
      <div className="profile-dropdown-header">
        <div className="profile-avatar">
          {role === 'admin' ? <ShieldIcon size={22} /> : <UserIcon size={22} />}
        </div>
        <div className="profile-info">
          <span className="profile-display-name">{displayName || username}</span>
          <span className="profile-username">@{username}</span>
          {email && <span className="profile-email">{email}</span>}
        </div>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="profile-dropdown-divider" />

      <div className="profile-dropdown-section">
        <span className="profile-section-label">Account</span>
        <div className="profile-role-row">
          <span className="profile-role-label">Role</span>
          <span className={`badge ${role === 'admin' ? 'badge-admin' : 'badge-student'}`}>
            {role === 'admin' ? 'Admin / Teacher' : 'Student'}
          </span>
        </div>
      </div>

      <div className="profile-dropdown-divider" />

      <div className="profile-dropdown-section">
        <span className="profile-section-label">Appearance</span>
        <button type="button" className="profile-menu-item" onClick={toggleTheme}>
          {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          <span className="profile-menu-item-value">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      <div className="profile-dropdown-divider" />

      <div className="profile-dropdown-section">
        <button type="button" className="profile-menu-item profile-menu-item-danger" onClick={handleLogout}>
          <LogoutIcon size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
