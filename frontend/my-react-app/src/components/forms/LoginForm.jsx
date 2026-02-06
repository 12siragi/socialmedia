import React, { useState } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import useUserActions from "../../hooks/user.actions";
import SocialLoginButtons from "./SocialLoginButtons";
import "../css/LoginForm.css";

function LoginForm() {
  const userActions = useUserActions();
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const loginForm = event.currentTarget;
    
    if (loginForm.checkValidity() === false) {
      event.stopPropagation();
    }
    
    setValidated(true);

    // Only proceed if form is valid
    if (loginForm.checkValidity()) {
      const formData = {
        email: form.email,
        password: form.password,
      };

      userActions.login(formData)
        .catch((err) => {
          if (err.response) {
            setError(err.response.data.detail || "Login failed");
          } else {
            setError("Network error");
          }
        });
    }
  };

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
            placeholder=""
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="py-2"
          />
          <Form.Control.Feedback type="invalid">
            Please provide a valid email address.
          </Form.Control.Feedback>
        </Form.Group>

        {/* Password Field */}
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder=""
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="py-2"
          />
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
          />
          <a href="/forgot-password" className="forgot-password-link">
            Forgot password?
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger login-error-alert mb-3">
            {error}
          </div>
        )}

        {/* Sign In Button */}
        <Button 
          variant="primary" 
          type="submit" 
          className="w-100 py-2 mb-3 fw-semibold login-submit-btn"
        >
          Sign in
        </Button>

        {/* Divider */}
        <div className="position-relative mb-3">
          <hr className="login-divider" />
          <span className="login-divider-text">
            Or continue with
          </span>
        </div>

        {/* Social Login Buttons - Now using component */}
        <SocialLoginButtons />
      </Form>
    </div>
  );
}

export default LoginForm;