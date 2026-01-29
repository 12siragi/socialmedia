// src/pages/Registration.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import RegistrationForm from "../components/forms/RegistrationForm";
import "../components/css/Registration.css";

function Registration() {
  return (
    <div className="registration-page">
      <Container>
        <Row className="justify-content-center">
          {/* Left side: introduction text */}
          <Col md={6} className="d-flex align-items-center">
            <div className="text-center text-md-start px-4">
              <h1 className="registration-welcome-title">
                Join PingChart Today!
              </h1>
              <p className="registration-welcome-subtitle">
                Connect with friends and share your experiences on the newest social platform.
              </p>
              <p className="registration-welcome-text">
                Create your account now and start exploring a world of possibilities. 
                Share your thoughts, discover new content, and build meaningful connections.
              </p>
              <p className="registration-signin-text">
                Already have an account?{" "}
                <Link to="/login/" className="registration-signin-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </Col>

          {/* Right side: registration form */}
          <Col md={6} className="p-5">
            <RegistrationForm />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Registration;