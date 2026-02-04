// src/pages/Login.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import LoginForm from "../components/forms/LoginForm";
import "../components/css/Login.css";

function Login() {
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
            <LoginForm />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;