import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useGradient } from '../context/GradientContext';
import { ShieldIcon, UserIcon, BookOpenIcon, GradientLogoIcon } from './Icons';
import { UserProfileModal } from './UserProfileModal';

export function Navbar(): JSX.Element {
  const { role, username, displayName } = useGradient();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { to: '/problems', label: 'Problems' },
    { to: '/contests', label: 'Contests' },
    { to: '/submissions', label: 'Submissions' },
  ];

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <NavLink to="/problems" className="brand">
          <GradientLogoIcon className="brand-logo-icon" size={26} />
          <span className="brand-text">GRADIENT</span>
        </NavLink>
        <nav className="navbar-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link-btn ${isActive || (item.to === '/problems' && location.pathname.startsWith('/problems/')) ? 'active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link-btn admin-link ${isActive ? 'active' : ''}`}
            >
              <ShieldIcon size={14} className="icon-left" />
              Admin Panel
            </NavLink>
          )}
        </nav>
      </div>

      <div className="navbar-right">
        <div className="user-profile-wrapper">
          <button
            type="button"
            className="user-profile-badge user-profile-badge-btn"
            onClick={() => setIsProfileOpen(prev => !prev)}
            aria-label="Open profile menu"
            aria-expanded={isProfileOpen}
          >
            {role === 'admin' ? (
              <ShieldIcon size={16} className="role-icon admin-color" />
            ) : role === 'teacher' ? (
              <BookOpenIcon size={16} className="role-icon teacher-color" />
            ) : (
              <UserIcon size={16} className="role-icon student-color" />
            )}
            <span className="username-text">{displayName || username}</span>
          </button>

          {isProfileOpen && (
            <UserProfileModal onClose={() => setIsProfileOpen(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
