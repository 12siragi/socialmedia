import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import useUserActions from "../hooks/user.actions";
import "../components/css/ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword } = useUserActions();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (error) {
      setMessage("❌ Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success State - Email Sent
  if (submitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card text-center">
          <div className="forgot-password-email-icon-wrapper">
            <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
            </svg>
          </div>

          <h2 className="forgot-password-title">
            Check Your Email
          </h2>

          <p className="forgot-password-success-text">
            If an account exists with {email}, we've sent a password reset
            link. Check your inbox!
          </p>

          <div className="mb-4 forgot-password-alert-info">
            <small>
              📧 Click the link in your email to reset your password.
              <br />
              ⏰ The link expires in 1 hour.
            </small>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate("/login/")}
            className="w-100 forgot-password-submit-btn"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="text-center">
          <div className="forgot-password-icon-wrapper">
            <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
          </div>
        </div>

        <h2 className="text-center forgot-password-title">
          Forgot Password?
        </h2>

        <p className="text-center forgot-password-text">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="forgot-password-label">
              Email Address
            </Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="forgot-password-input"
            />
          </Form.Group>

          {message && (
            <div className="mb-3 forgot-password-alert-error">
              {message}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-100 mb-3 forgot-password-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2"
                />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/login/")}
              className="btn btn-link forgot-password-back-link"
            >
              Back to Login
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default ForgotPassword;