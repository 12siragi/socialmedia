// src/components/Navbar.jsx
import React from "react";
import { Navbar, Container, Image, NavDropdown, Nav } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import useUserActions from "../hooks/user.actions"; // optional, if you have a user hook

function Navigationbar() {
  const navigate = useNavigate();
  const { getUser } = useUserActions(); // get logged-in user
  const user = getUser();

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login/");
  };

  if (!user) return null; // prevent errors if user is not loaded yet

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container fluid>
        {/* Brand */}
        <Navbar.Brand className="fw-bold ms-3" href="#home">
          Postagram
        </Navbar.Brand>

        {/* Right - User Dropdown */}
        <Nav className="ms-auto">
          <NavDropdown
            title={
              <Image
                src={user.avatar}
                roundedCircle
                width={36}
                height={36}
              />
            }
            align="end"
          >
            <NavDropdown.Item as={Link} to={`/profile/${user.id}/`}>
              Profile
            </NavDropdown.Item>
            <NavDropdown.Item onClick={handleLogout}>
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Navigationbar;
