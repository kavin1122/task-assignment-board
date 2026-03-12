import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navigation = () => {
  const { user, logout, isAuthenticated, isAdmin, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Toggle mobile menu
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  // Close mobile menu when a link is clicked
  const closeMobile = () => setMobileOpen(false);

  const adminLinks = [
    { to: '/admin-dashboard', icon: '⚡', label: 'Admin Panel' },
    { to: '/projects', icon: '📂', label: 'Manage Projects' },
  ];

  const userLinks = [
    { to: '/user-dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/projects', icon: '📂', label: 'My Projects' },
  ];

  const navLinks = isAdmin ? adminLinks : userLinks;
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  // ── Public Top Navbar (Logged Out) ──
  if (!isAuthenticated) {
    return (
      <nav className="adv-navbar">
        <Container className="adv-navbar-inner">
          <Link to="/" className="adv-brand">
            <span className="adv-brand-icon">✦</span>
            <span className="adv-brand-text">TaskBoard</span>
          </Link>
          <div className="adv-nav-right">
            <div className="adv-auth-links">
              <Link to="/login" className="adv-login-link">Sign In</Link>
              <Link to="/register" className="adv-register-btn">Get Started →</Link>
            </div>
          </div>
        </Container>
      </nav>
    );
  }

  // ── Private Sidebar (Logged In) ──
  return (
    <>
      {/* Mobile Toggle Button (only visible on small screens) */}
      <div className="sidebar-mobile-toggle">
        <Link to="/" className="adv-brand sidebar-mobile-brand">
          <span className="adv-brand-icon">✦</span>
          <span className="adv-brand-text">TaskBoard</span>
        </Link>
        <button className={`adv-hamburger ${mobileOpen ? 'open' : ''}`} onClick={toggleMobile}>
          <span /><span /><span />
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <div className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`} onClick={closeMobile} />

      {/* Main Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="adv-brand" onClick={closeMobile}>
            <span className="adv-brand-icon">✦</span>
            <span className="adv-brand-text">TaskBoard</span>
          </Link>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="sidebar-nav-heading">MENU</div>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                <span className="sidebar-link-label">{link.label}</span>
                {isActive(link.to) && <span className="sidebar-active-indicator" />}
              </Link>
            ))}
            
            <div className="sidebar-divider" />
            <div className="sidebar-nav-heading">USER</div>
            
            <Link to="/profile" className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`} onClick={closeMobile}>
              <span className="sidebar-link-icon">👤</span>
              <span className="sidebar-link-label">Profile Settings</span>
            </Link>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">
                <span className="sidebar-role-dot" />
                {role}
              </div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
