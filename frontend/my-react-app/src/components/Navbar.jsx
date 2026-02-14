// src/components/Navbar.jsx - FIXED VERSION (Media URL)
import React, { memo, useState } from "react";
import { Navbar, Container, Image, NavDropdown, Nav } from "react-bootstrap";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { authManager } from "./helpers/authManager";
import "./css/Navbar.css";


function Navigationbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    authManager.clearAuth();
    navigate("/login/");
    setExpanded(false); // Close navbar on logout
  };

  const handleNavClick = () => {
    setExpanded(false); // Close navbar when clicking nav items
  };

  // Helper function to check if current route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // ✅ FIXED: Proper avatar URL with backend URL
  const getAvatarUrl = () => {
    // 1. Check if user has uploaded avatar
    if (user?.avatar) {
      // If it's already a full URL, use it
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      // ✅ Prepend BACKEND_URL for relative paths
      return `${BACKEND_URL}${user.avatar}`;
    }
    
    // 2. Check if user has avatar_url (cached)
    if (user?.avatar_url) {
      // If it's already a full URL, use it
      if (user.avatar_url.startsWith('http')) {
        return user.avatar_url;
      }
      // ✅ Prepend BACKEND_URL for relative paths
      return `${BACKEND_URL}${user.avatar_url}`;
    }
    
    // 3. Fallback to ui-avatars.com
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.first_name || 'User')}+${encodeURIComponent(user?.last_name || '')}&background=8b5cf6&color=fff&bold=true`;
  };

  const avatarUrl = getAvatarUrl();

  // ✅ Show navbar skeleton for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Navbar className="app-navbar" expand="lg">
        <Container fluid>
          <Navbar.Brand as={Link} to="/login" >
            <span className="brand-text">PingChart</span>
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar 
      className="app-navbar" 
      expand="lg" 
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container fluid>
        <Navbar.Brand as={Link} to="/"  onClick={handleNavClick}>
          <span className="brand-text">PingChart</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" className="custom-toggler">
          <span className="toggle-line" />
          <span className="toggle-line" />
          <span className="toggle-line" />
        </Navbar.Toggle>

        <Navbar.Collapse id="navbar-nav">
          {/* Center Navigation Links */}
          <Nav className="navbar-center mx-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={`nav-link-item ${isActiveRoute('/') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <i className="bi bi-house-door nav-icon" />
              <span className="nav-text">Home</span>
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/explore" 
              className={`nav-link-item ${isActiveRoute('/explore') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <i className="bi bi-compass nav-icon" />
              <span className="nav-text">Explore</span>
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/messages" 
              className={`nav-link-item ${isActiveRoute('/messages') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <i className="bi bi-chat-dots nav-icon" />
              <span className="nav-text">Messages</span>
            </Nav.Link>
          </Nav>

          {/* User Menu */}
          <Nav className="navbar-user ms-lg-auto">
            {/* User Name - Desktop Only */}
            <div className="user-greeting d-none d-lg-flex align-items-center me-3">
              <span className="greeting-text">
                Hello, <strong>{user?.first_name || 'User'}</strong>
              </span>
            </div>

            {/* User Dropdown */}
            <NavDropdown
              align="end"
              className="user-dropdown"
              title={
                <div className="user-avatar-wrapper">
                  <Image
                    src={avatarUrl}
                    roundedCircle
                    width={40}
                    height={40}
                    alt="User avatar"
                    className="user-avatar"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.first_name || 'User')}+${encodeURIComponent(user?.last_name || '')}&background=8b5cf6&color=fff&bold=true`;
                    }}
                  />
                  <span className="online-indicator" />
                </div>
              }
            >
              {/* Dropdown Header */}
              <div className="dropdown-header-custom">
                <div className="user-info">
                  <div className="user-name">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>

              <NavDropdown.Divider />

              {/* Profile Link */}
              <NavDropdown.Item 
                as={Link} 
                to={`/profile/${user?.id}/`}
                onClick={handleNavClick}
                className="dropdown-item-custom"
              >
                <i className="bi bi-person-circle dropdown-icon" />
                <span>My Profile</span>
              </NavDropdown.Item>

              {/* Settings Link */}
              <NavDropdown.Item 
                as={Link} 
                to="/settings"
                onClick={handleNavClick}
                className="dropdown-item-custom"
              >
                <i className="bi bi-gear dropdown-icon" />
                <span>Settings</span>
              </NavDropdown.Item>

              <NavDropdown.Divider />

              {/* Logout */}
              <NavDropdown.Item 
                onClick={handleLogout}
                className="dropdown-item-custom logout-item"
              >
                <i className="bi bi-box-arrow-right dropdown-icon" />
                <span>Logout</span>
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

// ✅ Memoize to prevent re-renders when parent updates
export default memo(Navigationbar);