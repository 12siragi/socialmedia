import React, { useState } from "react";
import { Form, Button, Row, Col, Spinner, InputGroup } from "react-bootstrap";
import useUserActions from "../../hooks/user.actions";
import SocialLoginButtons from "./SocialLoginButtons";
import "../css/RegistrationForm.css";

function RegistrationForm() {
  const userActions = useUserActions();
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password1: "",
    password2: ""
  });
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;

    if (formElement.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    if (form.password1 !== form.password2) {
      setError("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }

    setValidated(true);
    setError(null);
    setIsLoading(true);

    try {
      // ✅ This will redirect immediately and process in background
      await userActions.register(form);
      // User is already on verification page at this point
    } catch (err) {
      // ✅ Only show error if it happens BEFORE redirect
      const apiError = err.response?.data;
      
      let errorMessage = "Registration failed";
      
      if (apiError?.detail) {
        errorMessage = apiError.detail;
      } else if (apiError?.email) {
        errorMessage = Array.isArray(apiError.email) 
          ? apiError.email[0] 
          : apiError.email;
      } else if (apiError?.password1) {
        errorMessage = Array.isArray(apiError.password1)
          ? apiError.password1[0]
          : apiError.password1;
      } else if (apiError?.non_field_errors) {
        errorMessage = Array.isArray(apiError.non_field_errors)
          ? apiError.non_field_errors[0]
          : apiError.non_field_errors;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-form-container">
      <Form
        id="registration-form"
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
      >
        {/* Name Fields Row */}
        <Row>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="John"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
                className="py-2"
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                First name is required.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Doe"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
                className="py-2"
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                Last name is required.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        {/* Email Field */}
        <Form.Group className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="py-2"
            disabled={isLoading}
          />
          <Form.Control.Feedback type="invalid">
            Please provide a valid email address.
          </Form.Control.Feedback>
        </Form.Group>

        {/* Password Field */}
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword1 ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              value={form.password1}
              onChange={(e) => setForm({ ...form, password1: e.target.value })}
              required
              className="py-2 password-input"
              disabled={isLoading}
            />
            <Button
              variant="outline-secondary"
              className="password-toggle-btn"
              onClick={() => setShowPassword1(!showPassword1)}
              disabled={isLoading}
              type="button"
              tabIndex={-1}
            >
              {showPassword1 ? (
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
          <Form.Text className="text-muted">
            Must be at least 8 characters long
          </Form.Text>
        </Form.Group>

        {/* Confirm Password Field */}
        <Form.Group className="mb-3">
          <Form.Label>Confirm Password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword2 ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              value={form.password2}
              onChange={(e) => setForm({ ...form, password2: e.target.value })}
              required
              className="py-2 password-input"
              disabled={isLoading}
            />
            <Button
              variant="outline-secondary"
              className="password-toggle-btn"
              onClick={() => setShowPassword2(!showPassword2)}
              disabled={isLoading}
              type="button"
              tabIndex={-1}
            >
              {showPassword2 ? (
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
            Please confirm your password.
          </Form.Control.Feedback>
        </Form.Group>

        {/* Terms and Conditions Checkbox */}
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="terms-checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={isLoading}
            label={
              <span className="registration-terms-label">
                I agree to the{" "}
                <a href="/terms" className="registration-terms-link">
                  Terms and Conditions
                </a>
              </span>
            }
            required
          />
        </Form.Group>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger registration-error-alert mb-3">
            {error}
          </div>
        )}

        {/* Register Button */}
        <Button 
          variant="primary" 
          type="submit" 
          className="w-100 py-2 mb-3 fw-semibold registration-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        {/* Divider */}
        <div className="position-relative mb-3">
          <hr className="registration-divider" />
          <span className="registration-divider-text">
            Or sign up with
          </span>
        </div>
        
        {/* Social Login Buttons */}
        <SocialLoginButtons disabled={isLoading} />
      </Form>
    </div>
  );
}

export default RegistrationForm;