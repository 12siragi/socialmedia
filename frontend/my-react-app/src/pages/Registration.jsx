// src/pages/Registration.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import RegistrationForm from "../components/forms/RegistrationForm";
import "../components/css/Registration.css";

function Registration() {
  return (
    <div className="registration-page">
      <Container className="registration-container">
        <Row className="justify-content-center align-items-center g-4">
          {/* Left side: introduction text */}
          <Col lg={6} md={12} className="d-flex align-items-center">
            <div className="registration-welcome-section text-center text-lg-start">
              <div className="welcome-badge">
                <span className="badge-icon">🎉</span>
                <span className="badge-text">Get Started</span>
              </div>
              
              <h1 className="registration-welcome-title">
                Join
                <span className="brand-highlight"> PingChart</span>
                <span className="title-decoration"> Today!</span>
              </h1>
              
              <p className="registration-welcome-subtitle">
                Connect with friends and share your experiences on the
                <span className="subtitle-highlight"> newest social platform</span>.
              </p>
              
              <p className="registration-welcome-text">
                Create your account now and start exploring a world of possibilities. 
                Share your thoughts, discover new content, and build meaningful connections.
              </p>

              <div className="registration-cta-section">
                <p className="registration-signin-text">
                  Already have an account?
                </p>
                <Link to="/login/" className="registration-signin-link">
                  Sign in here
                </Link>
              </div>

              {/* Feature highlights - hidden on mobile to save space */}
              <div className="feature-highlights d-none d-lg-block">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Free forever</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">No credit card required</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Join thousands of users</span>
                </div>
              </div>
            </div>
          </Col>

          {/* Right side: registration form */}
          <Col lg={6} md={12} className="registration-form-column">
            <RegistrationForm />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Registration;