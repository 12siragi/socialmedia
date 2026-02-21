// src/components/Navbar.jsx
import React, { memo, useState, useEffect } from "react";
import { Navbar, Nav, Container, NavDropdown, Image } from "react-bootstrap";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import useUserActions from "../hooks/user.actions";
import "./css/Navbar.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;

function Navigationbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Force re-render
  const { logout, getAccountSettings } = useUserActions();

  const handleLogout = () => {
    logout();
  };

  const handleNavClick = () => {
    setExpanded(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Initial fetch on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAvatar();
    }
  }, [isAuthenticated, user?.id]);

  // ✅ Listen for avatar update events
  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      console.log('🎉 Avatar updated! Refreshing navbar avatar...', event.detail);
      fetchAvatar();
      setAvatarKey(Date.now()); // Force image reload
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [isAuthenticated, user]);

  const fetchAvatar = async () => {
    try {
      const settings = await getAccountSettings();
      
      if (settings?.avatar) {
        const url = settings.avatar.startsWith('http') 
          ? settings.avatar 
          : `${BACKEND_URL}${settings.avatar}`;
        setAvatarUrl(url);
      } else if (settings?.avatar_url) {
        const url = settings.avatar_url.startsWith('http')
          ? settings.avatar_url
          : `${BACKEND_URL}${settings.avatar_url}`;
        setAvatarUrl(url);
      } else {
        setAvatarUrl(getFallbackAvatar(settings));
      }
    } catch (error) {
      console.error("Failed to fetch avatar:", error);
      setAvatarUrl(getFallbackAvatar());
    }
  };

  const getFallbackAvatar = (settings = null) => {
    const firstName = settings?.first_name || user?.first_name || "User";
    const lastName = settings?.last_name || user?.last_name || "";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=8b5cf6&color=fff&bold=true`;
  };

  if (!isAuthenticated) {
    return (
      <Navbar className="app-navbar" bg="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand as={Link} to="/login">
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
        <Navbar.Brand as={Link} to="/" onClick={handleNavClick}>
          <span className="brand-text">PingChart</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" className="custom-toggler">
          <span className="toggle-line" />
          <span className="toggle-line" />
          <span className="toggle-line" />
        </Navbar.Toggle>

        <Navbar.Collapse id="navbar-nav">
          <Nav className="navbar-center mx-auto">
            {isAuthenticated && (
              <>
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
              </>
            )}
          </Nav>

          <Nav className="navbar-user ms-lg-auto">
            <div className="user-greeting d-none d-lg-flex align-items-center me-3">
              <span className="greeting-text">
                Hello, <strong>{user?.first_name || 'User'}</strong>
              </span>
            </div>

            <NavDropdown
              align="end"
              className="user-dropdown"
              title={
                <div className="user-avatar-wrapper">
                  <Image
                    key={avatarKey} // ✅ Force re-render on update
                    src={avatarUrl || getFallbackAvatar()}
                    roundedCircle
                    width={40}
                    height={40}
                    alt="User avatar"
                    className="user-avatar"
                    onError={(e) => {
                      console.log("Avatar failed to load, using fallback");
                      e.target.src = getFallbackAvatar();
                    }}
                  />
                  <span className="online-indicator" />
                </div>
              }
            >
              <div className="dropdown-header-custom">
                <div className="user-info">
                  <div className="user-name">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>

              <NavDropdown.Divider />

              <NavDropdown.Item 
                as={Link} 
                to={`/profile/${user?.id}/`}
                onClick={handleNavClick}
                className="dropdown-item-custom"
              >
                <i className="bi bi-person-circle dropdown-icon" />
                <span>My Profile</span>
              </NavDropdown.Item>

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

export default memo(Navigationbar);