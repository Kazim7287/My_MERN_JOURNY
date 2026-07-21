import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span className="brand-icon">📝</span>
          <span className="brand-text">Notes App</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          {isAuthenticated ? (
            <>
              {/* Authenticated Links */}
              <div className="nav-links">
                <Link 
                  to="/" 
                  className={`nav-link ${isActive('/')}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">📋</span>
                  <span>My Notes</span>
                </Link>
                <Link 
                  to="/create" 
                  className={`nav-link create-link ${isActive('/create')}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">✨</span>
                  <span>New Note</span>
                </Link>
              </div>

              {/* User Menu */}
              <div className="user-menu-wrapper">
                <div 
                  className="user-menu-trigger"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="user-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                  </div>
                  <span className="user-name">{user?.name || 'User'}</span>
                  <span className={`dropdown-arrow ${showUserDropdown ? 'open' : ''}`}>
                    ▼
                  </span>
                </div>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <>
                    <div 
                      className="dropdown-backdrop"
                      onClick={() => setShowUserDropdown(false)}
                    ></div>
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                        </div>
                        <div className="dropdown-user-info">
                          <span className="dropdown-user-name">{user?.name}</span>
                          <span className="dropdown-user-email">{user?.email}</span>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link 
                        to="/" 
                        className="dropdown-item"
                        onClick={() => {
                          setShowUserDropdown(false);
                          closeMobileMenu();
                        }}
                      >
                        <span>📋</span> My Notes
                      </Link>
                      <Link 
                        to="/create" 
                        className="dropdown-item"
                        onClick={() => {
                          setShowUserDropdown(false);
                          closeMobileMenu();
                        }}
                      >
                        <span>✨</span> Create Note
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button 
                        onClick={handleLogout} 
                        className="dropdown-item logout-item"
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Unauthenticated Links */}
              <div className="nav-links">
                <Link 
                  to="/" 
                  className={`nav-link ${isActive('/')}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">🏠</span>
                  <span>Home</span>
                </Link>
                <Link 
                  to="/login" 
                  className={`nav-link ${isActive('/login')}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">🔑</span>
                  <span>Login</span>
                </Link>
                <Link 
                  to="/register" 
                  className="nav-link signup-link"
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">🚀</span>
                  <span>Sign Up</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;