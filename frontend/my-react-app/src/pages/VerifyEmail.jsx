import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import useUserActions from "../hooks/user.actions";
import "../components/css/EmailVerifyFailed.css";

function EmailVerifyFailed() {
  const navigate = useNavigate();
  const { resendVerificationEmail } = useUserActions();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleResend = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await resendVerificationEmail(email);
      setMessage({
        type: 'success',
        text: '✅ Verification email sent! Check your inbox.'
      });
      setEmail("");
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || "Failed to send email. Please try again.";
      setMessage({
        type: 'error',
        text: `❌ ${errorMsg}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-verify-failed-container">
      <div className="email-verify-failed-card">
        {/* Error Icon */}
        <div className="text-center">
          <div className="email-verify-failed-icon-wrapper">
            <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center email-verify-failed-title">
          Verification Failed ❌
        </h2>

        {/* Message */}
        <p className="text-center email-verify-failed-text">
          The verification link is invalid or has expired.
        </p>

        {/* Resend Form */}
        <Form onSubmit={handleResend}>
          <Form.Group className="mb-3">
            <Form.Label className="email-verify-failed-label">
              Email Address
            </Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="email-verify-failed-input"
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 mb-3 email-verify-failed-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  className="me-2"
                />
                Sending...
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>

          {/* Message */}
          {message && (
            <div
              className={`mb-0 ${
                message.type === 'success'
                  ? 'email-verify-failed-alert-success'
                  : 'email-verify-failed-alert-error'
              }`}
            >
              {message.text}
            </div>
          )}
        </Form>

        {/* Back to Login */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/login/")}
            className="btn btn-link email-verify-failed-back-link"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerifyFailed;