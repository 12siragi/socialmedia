import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import useUserActions from "../hooks/user.actions";
import "../components/css/ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useUserActions();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      navigate("/reset-password-failed/");
    }
  }, [uid, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(uid, token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login/");
      }, 3000);
    } catch (error) {
      setError(
        error.response?.data?.detail || "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card text-center">
          <div className="reset-password-success-icon-wrapper">
            <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
            </svg>
          </div>

          <h2 className="reset-password-title">
            Password Reset! ✅
          </h2>

          <p className="reset-password-success-text">
            Your password has been successfully reset. You can now log in with
            your new password.
          </p>

          <Button
            variant="primary"
            onClick={() => navigate("/login/")}
            className="w-100 reset-password-submit-btn"
          >
            Go to Login
          </Button>

          <p className="reset-password-redirect-notice">
            Redirecting in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  // Reset Password Form
  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="text-center">
          <div className="reset-password-icon-wrapper">
            <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
          </div>
        </div>

        <h2 className="text-center reset-password-title">
          Reset Your Password
        </h2>

        <p className="text-center reset-password-text">
          Enter your new password below.
        </p>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="reset-password-label">
              New Password
            </Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={8}
              className="reset-password-input"
            />
            <Form.Text className="reset-password-helper-text">
              Must be at least 8 characters
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="reset-password-label">
              Confirm Password
            </Form.Label>
            <Form.Control
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={8}
              className="reset-password-input"
            />
          </Form.Group>

          {error && (
            <div className="mb-3 reset-password-alert-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-100 reset-password-submit-btn"
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
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </Form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/login/")}
            className="btn btn-link reset-password-back-link"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;