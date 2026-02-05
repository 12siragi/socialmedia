import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import useUserActions from "../hooks/user.actions";
import "../components/css/ResetPasswordFailed.css";

function ResetPasswordFailed() {
  const navigate = useNavigate();
  const { forgotPassword } = useUserActions();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleResend = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await forgotPassword(email);
      setMessage({
        type: 'success',
        text: '✅ Password reset email sent! Check your inbox.'
      });
      setEmail("");
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ Failed to send email. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-failed-container">
      <div className="reset-password-failed-card">
        <div className="text-center">
          <div className="reset-password-failed-icon-wrapper">
            <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </div>
        </div>

        <h2 className="text-center reset-password-failed-title">
          Reset Link Invalid ❌
        </h2>

        <p className="text-center reset-password-failed-text">
          This password reset link is invalid or has expired.
        </p>

        <Form onSubmit={handleResend}>
          <Form.Group className="mb-3">
            <Form.Label className="reset-password-failed-label">
              Email Address
            </Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="reset-password-failed-input"
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 mb-3 reset-password-failed-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              "Request New Reset Link"
            )}
          </Button>

          {message && (
            <div
              className={`mb-0 ${
                message.type === 'success'
                  ? 'reset-password-failed-alert-success'
                  : 'reset-password-failed-alert-error'
              }`}
            >
              {message.text}
            </div>
          )}
        </Form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/login/")}
            className="btn btn-link reset-password-failed-back-link"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordFailed;