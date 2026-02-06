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
      <Container>
        <Row className="justify-content-center">
          {/* Left side: introduction text */}
          <Col md={6} className="d-flex align-items-center">
            <div className="text-center text-md-start px-4">
              <h1 className="login-welcome-title">
                Welcome to PingChart!
              </h1>
              <p className="login-welcome-subtitle">
                Login now and start enjoying our amazing features!
              </p>
              <p className="login-welcome-text">
                Don't have an account yet?{" "}
                <Link to="/register/" className="login-signup-link">
                  Create one now
                </Link>
              </p>
            </div>
          </Col>

          {/* Right side: login form */}
          <Col md={6} className="p-5">
            {/* ✅ Show verification result if redirected from VerifyEmail */}
            {verified === true && (
              <Alert variant="success" className="mb-3">
                Email verified successfully! You can now log in.
              </Alert>
            )}
            {verified === false && (
              <Alert variant="danger" className="mb-3">
                Verification link is invalid or expired. Please request a new one.
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
