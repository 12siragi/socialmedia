import React from "react";
import { randomAvatar } from "./utils";
import { Navbar, Container, Image, NavDropdown, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function Navigationbar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login/");
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container fluid>
        
        {/* Left Container - Brand */}
        <Container className="d-flex align-items-center">
          <Navbar.Brand className="fw-bold ms-9" href="#home">
            Postagram
          </Navbar.Brand>
        </Container>

        {/* Right Container - User Profile */}
        <Container className="d-flex justify-content-end">
          <Nav className="ms-9">
            <NavDropdown
              title={
                <Image
                  src={randomAvatar()}
                  roundedCircle
                  width={36}
                  height={36}
                />
              }
              align="end"
            >
              <NavDropdown.Item href="#">Profile</NavDropdown.Item>
              <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Container>

      </Container>
    </Navbar>
  );
}

export default Navigationbar;