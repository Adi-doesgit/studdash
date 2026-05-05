/**
 * Navbar Component — Role-aware navigation
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based navigation links
  const navLinks = {
    student: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/notes', label: 'Notes' },
      { to: '/submit-assignment', label: 'Submit Assignment' },
    ],
    teacher: [
      { to: '/upload-notes', label: 'Upload Notes' },
      { to: '/assignments', label: 'Assignments' },
    ],
    admin: [
      { to: '/admin', label: 'Admin Panel' },
      { to: '/admin/metrics', label: 'Metrics' },
    ],
  };

  const links = navLinks[user?.role] || [];

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="nav-logo">🎓</span>
        <span className="nav-title">StudDash</span>
      </div>

      <div className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="nav-user">
        <span className="nav-username">{user?.name}</span>
        <span className="nav-role-badge">{user?.role}</span>
        <button className="btn btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
