// src/components/Navbar.jsx
import React, { memo } from "react";
import { Navbar, Container, Image, NavDropdown, Nav } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { authManager } from "./helpers/authManager";
import "./css/Navbar.css";

function Navigationbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // ✅ Reactive, no function recreation

  const handleLogout = () => {
    authManager.clearAuth(); // ✅ Direct call, triggers re-render via context
    navigate("/login/");
  };

  // ✅ Show navbar skeleton instead of hiding completely
  if (!isAuthenticated) {
    return (
      <Navbar className="app-navbar" expand="lg">
        <Container fluid>
          <Navbar.Brand as={Link} to="/login" className="app-brand">
            PingChart
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar className="app-navbar" expand="lg">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="app-brand">
          PingChart
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav">
          <span className="toggle-line" />
          <span className="toggle-line" />
          <span className="toggle-line" />
        </Navbar.Toggle>

        <Navbar.Collapse id="navbar-nav">
          <div className="navbar-spacer" />

          <Nav className="navbar-center">
            <Nav.Link as={Link} to="/" className="mx-2">
              <i className="bi bi-house-door me-2" />
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/explore" className="mx-2">
              <i className="bi bi-compass me-2" />
              Explore
            </Nav.Link>
            <Nav.Link as={Link} to="/messages" className="mx-2">
              <i className="bi bi-chat-dots me-2" />
              Messages
            </Nav.Link>
          </Nav>

          <Nav className="navbar-user align-items-center">
            <span className="text-light me-3 d-none d-md-inline">
              {user?.first_name || user?.email}
            </span>
            <NavDropdown
              align="end"
              title={
                <Image
                  src={user?.avatar || '/default-avatar.png'}
                  roundedCircle
                  width={36}
                  height={36}
                  alt="User avatar"
                />
              }
            >
              <div className="dropdown-header-custom">
                <div className="fw-bold text-white">
                  {user?.first_name} {user?.last_name}
                </div>
                <small className="text-muted">{user?.email}</small>
              </div>

              <NavDropdown.Item as={Link} to={`/profile/${user?.id}/`}>
                Profile
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/settings">
                <i className="bi bi-gear me-2" />
                Settings
              </NavDropdown.Item>
              <NavDropdown.Item onClick={handleLogout}>
                Logout
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