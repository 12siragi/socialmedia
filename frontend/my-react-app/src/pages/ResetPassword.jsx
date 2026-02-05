import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Card, Button, Form, Spinner, Alert } from "react-bootstrap";
import useUserActions from "../hooks/user.actions";

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

  if (success) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Card
          className="shadow-lg p-4 text-center"
          style={{
            maxWidth: "500px",
            width: "100%",
            backgroundColor: "#1a1d2e",
            border: "1px solid #2d3348",
          }}
        >
          <Card.Body>
            <div className="mb-4">
              <div
                className="mx-auto d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "#10b981",
                }}
              >
                <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                </svg>
              </div>
            </div>

            <h2 className="mb-3" style={{ color: "white" }}>
              Password Reset! ✅
            </h2>

            <p className="mb-4" style={{ color: "#8e8e93" }}>
              Your password has been successfully reset. You can now log in with
              your new password.
            </p>

            <Button
              variant="primary"
              onClick={() => navigate("/login/")}
              className="w-100"
              style={{
                backgroundColor: "#8b5cf6",
                border: "none",
                padding: "0.75rem",
                fontWeight: "600",
              }}
            >
              Go to Login
            </Button>

            <p style={{ color: "#8e8e93", fontSize: "12px", marginTop: "1rem" }}>
              Redirecting in 3 seconds...
            </p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card
        className="shadow-lg p-4"
        style={{
          maxWidth: "500px",
          width: "100%",
          backgroundColor: "#1a1d2e",
          border: "1px solid #2d3348",
        }}
      >
        <Card.Body>
          <div className="text-center mb-4">
            <div
              className="mx-auto d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#8b5cf6",
              }}
            >
              <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
            </div>
          </div>

          <h2 className="text-center mb-3" style={{ color: "white" }}>
            Reset Your Password
          </h2>

          <p className="text-center mb-4" style={{ color: "#8e8e93" }}>
            Enter your new password below.
          </p>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "white" }}>New Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                style={{
                  backgroundColor: "#1e2235",
                  border: "1px solid #2d3348",
                  color: "#fff",
                }}
              />
              <Form.Text style={{ color: "#8e8e93", fontSize: "12px" }}>
                Must be at least 8 characters
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: "white" }}>
                Confirm Password
              </Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                style={{
                  backgroundColor: "#1e2235",
                  border: "1px solid #2d3348",
                  color: "#fff",
                }}
              />
            </Form.Group>

            {error && (
              <Alert
                variant="danger"
                className="mb-3"
                style={{
                  backgroundColor: "#ef4444",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={isLoading}
              style={{
                backgroundColor: "#8b5cf6",
                border: "none",
                padding: "0.75rem",
                fontWeight: "600",
              }}
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
            <Button
              variant="link"
              onClick={() => navigate("/login/")}
              style={{ color: "#8b5cf6", textDecoration: "none" }}
            >
              Back to Login
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ResetPassword;