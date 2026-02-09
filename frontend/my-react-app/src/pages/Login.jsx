import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Container, Row, Col, Alert } from "react-bootstrap";
import LoginForm from "../components/forms/LoginForm";
import "../components/css/Login.css";

function Login() {
  const location = useLocation();
  const verified = location.state?.verified; // true, false, or undefined

  return (
    <div className="login-page">
      <Container className="login-container">
        <Row className="justify-content-center align-items-center g-4">
          {/* Left side: introduction text */}
          <Col lg={6} md={12} className="d-flex align-items-center">
            <div className="login-welcome-section text-center text-lg-start">
              <div className="welcome-badge">
                <span className="badge-icon">🚀</span>
                <span className="badge-text">Welcome Back</span>
              </div>
              
              <h1 className="login-welcome-title">
                Welcome to
                <span className="brand-highlight"> PingChart</span>
                <span className="title-decoration">!</span>
              </h1>
              
              <p className="login-welcome-subtitle">
                Login now and start enjoying our 
                <span className="subtitle-highlight"> amazing features</span>!
              </p>
              
              <div className="login-cta-section">
                <p className="login-welcome-text">
                  Don't have an account yet?
                </p>
                <Link to="/register/" className="login-signup-link">
                  Create one now
                </Link>
              </div>

              {/* Feature highlights - hidden on mobile to save space */}
              <div className="feature-highlights d-none d-lg-block">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Real-time monitoring</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Advanced analytics</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">24/7 support</span>
                </div>
              </div>
            </div>
          </Col>

          {/* Right side: login form */}
          <Col lg={6} md={12} className="login-form-column">
            {/* ✅ Show verification result if redirected from VerifyEmail */}
            {verified === true && (
              <Alert variant="success" className="verification-alert mb-3">
                <strong>✓ Success!</strong> Email verified successfully! You can now log in.
              </Alert>
            )}
            {verified === false && (
              <Alert variant="danger" className="verification-alert mb-3">
                <strong>✗ Error!</strong> Verification link is invalid or expired. Please request a new one.
              </Alert>
            )}

            <LoginForm />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;