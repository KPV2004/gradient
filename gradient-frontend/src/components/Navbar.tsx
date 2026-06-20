import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useGradient } from '../context/GradientContext';
import { ShieldIcon, UserIcon, SunIcon, MoonIcon, GradientLogoIcon } from './Icons';

export function Navbar(): JSX.Element {
  const { role, username, theme, toggleTheme, logout } = useGradient();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

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
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>

        <div className="user-profile-badge">
          {role === 'admin' ? (
            <ShieldIcon size={16} className="role-icon admin-color" />
          ) : (
            <UserIcon size={16} className="role-icon student-color" />
          )}
          <span className="username-text">{username}</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
