import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useGradient } from '../context/GradientContext';
import { ShieldIcon, UserIcon, SunIcon, MoonIcon, GradientLogoIcon } from './Icons';

export function Navbar(): JSX.Element {
  const { role, setRole, username, theme, toggleTheme } = useGradient();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value;
    const newRole = value === 'admin' ? 'admin' : 'student';
    setRole(newRole);
    // If we were on admin and switch to student, navigate back to problems
    if (newRole === 'student' && location.pathname.startsWith('/admin')) {
      navigate('/problems');
    }
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

        <div className="role-selector-wrapper">
          <label htmlFor="role-select" className="sr-only">Select Role</label>
          <select
            id="role-select"
            value={role}
            onChange={handleRoleChange}
            className={`role-select-dropdown ${role === 'admin' ? 'admin-border' : 'student-border'}`}
          >
            <option value="student">Student (User)</option>
            <option value="admin">Teacher (Admin)</option>
          </select>
        </div>
      </div>
    </header>
  );
}
