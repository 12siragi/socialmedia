import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import "../components/css/EmailVerifiedSuccess.css";

function EmailVerifiedSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to login after 5 seconds
    const timer = setTimeout(() => {
      navigate("/login/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="email-verified-success-container">
      <div className="email-verified-success-card text-center">
        {/* Success Icon */}
        <div className="email-verified-success-icon-wrapper">
          <svg width="40" height="40" fill="white" viewBox="0 0 16 16">
            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="email-verified-success-title">
          Email Verified! ✅
        </h2>

        {/* Message */}
        <p className="email-verified-success-text">
          Your email has been successfully verified. You can now log in to
          your account.
        </p>

        {/* Login Button */}
        <Button
          variant="primary"
          onClick={() => navigate("/login/")}
          className="w-100 mb-3 email-verified-success-btn"
        >
          Go to Login
        </Button>

        {/* Auto-redirect Notice */}
        <p className="email-verified-success-notice">
          Redirecting automatically in 5 seconds...
        </p>
      </div>
    </div>
  );
}

export default EmailVerifiedSuccess;