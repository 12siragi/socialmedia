import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, Spinner, Alert } from "react-bootstrap";
import useUserActions from "../hooks/user.actions";

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

  if (submitted) {
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
          <Card.Body className="text-center">
            <div className="mb-4">
              <div
                className="mx-auto d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "#8b5cf6",
                }}
              >
                <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
                  <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                </svg>
              </div>
            </div>

            <h2 className="mb-3" style={{ color: "white" }}>
              Check Your Email
            </h2>

            <p className="mb-4" style={{ color: "#8e8e93" }}>
              If an account exists with {email}, we've sent a password reset
              link. Check your inbox!
            </p>

            <Alert
              variant="info"
              className="mb-4"
              style={{
                backgroundColor: "#2d3348",
                border: "none",
                color: "#fff",
              }}
            >
              <small>
                📧 Click the link in your email to reset your password.
                <br />
                ⏰ The link expires in 1 hour.
              </small>
            </Alert>

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
              Back to Login
            </Button>
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
            Forgot Password?
          </h2>

          <p className="text-center mb-4" style={{ color: "#8e8e93" }}>
            Enter your email and we'll send you a link to reset your password.
          </p>

          <Form onSubmit={handleSubmit}>
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

            {message && (
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
                {message}
              </Alert>
            )}

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
              <Button
                variant="link"
                onClick={() => navigate("/login/")}
                style={{ color: "#8b5cf6", textDecoration: "none" }}
              >
                Back to Login
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ForgotPassword;