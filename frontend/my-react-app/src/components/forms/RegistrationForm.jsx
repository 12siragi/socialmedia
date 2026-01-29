import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import useUserActions from "../../hooks/user.actions";
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

  const handleSubmit = (event) => {
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

    const formData = form;
    userActions.register(formData)
      .catch((err) => {
        const apiError = err.response?.data;
        setError(
          apiError?.detail ||
          apiError?.email ||
          "Registration failed"
        );
      });
  };

  const handleGoogleSignup = () => {
    // Implement Google OAuth signup here
    console.log("Google signup clicked");
  };

  const handleGithubSignup = () => {
    // Implement GitHub OAuth signup here
    console.log("GitHub signup clicked");
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
                placeholder=""
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
                className="py-2"
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
                placeholder=""
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
                className="py-2"
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
            value={form.password1}
            onChange={(e) => setForm({ ...form, password1: e.target.value })}
            required
            className="py-2"
          />
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
          <Form.Control
            type="password"
            placeholder=""
            minLength={8}
            value={form.password2}
            onChange={(e) => setForm({ ...form, password2: e.target.value })}
            required
            className="py-2"
          />
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
        >
          Create Account
        </Button>

        {/* Divider */}
        <div className="position-relative mb-3">
          <hr className="registration-divider" />
          <span className="registration-divider-text">
            Or sign up with
          </span>
        </div>

        {/* Social Signup Buttons */}
        <Row className="g-2">
          <Col xs={6}>
            <Button
              variant="outline-secondary"
              className="w-100 d-flex align-items-center justify-content-center py-2 social-signup-btn"
              onClick={handleGoogleSignup}
            >
              <svg className="me-2" width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Google
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="outline-secondary"
              className="w-100 d-flex align-items-center justify-content-center py-2 social-signup-btn"
              onClick={handleGithubSignup}
            >
              <svg className="me-2" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

export default RegistrationForm;