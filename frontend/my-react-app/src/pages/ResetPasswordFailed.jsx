import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, Spinner, Alert } from "react-bootstrap";
import useUserActions from "../hooks/user.actions";

function ResetPasswordFailed() {
  const navigate = useNavigate();
  const { forgotPassword } = useUserActions();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      await forgotPassword(email);
      setMessage("✅ Password reset email sent! Check your inbox.");
      setEmail("");
    } catch (error) {
      setMessage("❌ Failed to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
                backgroundColor: "#ef4444",
              }}
            >
              <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </div>
          </div>

          <h2 className="text-center mb-3" style={{ color: "white" }}>
            Reset Link Invalid ❌
          </h2>

          <p className="text-center mb-4" style={{ color: "#8e8e93" }}>
            This password reset link is invalid or has expired.
          </p>

          <Form onSubmit={handleResend}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "white" }}>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  backgroundColor: "#1e2235",
                  border: "1px solid #2d3348",
                  color: "#fff",
                }}
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100 mb-3"
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
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Sending...
                </>
              ) : (
                "Request New Reset Link"
              )}
            </Button>

            {message && (
              <Alert
                variant={message.includes("✅") ? "success" : "danger"}
                className="mb-0"
                style={{
                  backgroundColor: message.includes("✅") ? "#10b981" : "#ef4444",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                {message}
              </Alert>
            )}
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

export default ResetPasswordFailed;