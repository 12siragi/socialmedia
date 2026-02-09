// src/components/forms/LoginForm.jsx
import React, { useState, useCallback, memo } from "react";
import { Form, Button, Alert, InputGroup } from "react-bootstrap";
import { authManager } from "../helpers/authManager";
import axiosService from "../helpers/axios";
import { useNavigate } from "react-router-dom";
import SocialLoginButtons from "./SocialLoginButtons";
import "../css/LoginForm.css";

function LoginForm() {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Memoized to prevent recreation on every keystroke
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    const loginForm = event.currentTarget;
    
    if (loginForm.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    setIsLoading(true);
    setError(null);

    try {
      const res = await axiosService.post(`/api/auth/login/`, {
        email: form.email,
        password: form.password,
      });
      
      authManager.setAuth(res.data); // ✅ Triggers re-render via context
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [form.email, form.password, navigate]);

  return (
    <div className="login-form-container">
      <Form
        id="login-form"
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
      >
        {/* Email Field */}
        <Form.Group className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={isLoading}
            className="py-2"
          />
          <Form.Control.Feedback type="invalid">
            Please provide a valid email address.
          </Form.Control.Feedback>
        </Form.Group>

        {/* Password Field with Toggle */}
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              disabled={isLoading}
              className="py-2 password-input"
            />
            <Button
              variant="outline-secondary"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              type="button"
              tabIndex={-1}
            >
              {showPassword ? (
                // Eye Slash Icon (Hide)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                // Eye Icon (Show)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </Button>
          </InputGroup>
          <Form.Control.Feedback type="invalid">
            Password must be at least 8 characters.
          </Form.Control.Feedback>
        </Form.Group>

        {/* Remember Me and Forgot Password Row */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Form.Check
            type="checkbox"
            id="remember-me"
            label="Remember me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <a href="/forgot-password" className="forgot-password-link">
            Forgot password?
          </a>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="login-error-alert mb-3">
            {error}
          </Alert>
        )}

        {/* Sign In Button */}
        <Button 
          variant="primary" 
          type="submit" 
          className="w-100 py-2 mb-3 fw-semibold login-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>

        {/* Divider */}
        <div className="position-relative mb-3">
          <hr className="login-divider" />
          <span className="login-divider-text">
            Or continue with
          </span>
        </div>

        {/* Social Login Buttons */}
        <SocialLoginButtons disabled={isLoading} />
      </Form>
    </div>
  );
}

export default memo(LoginForm);