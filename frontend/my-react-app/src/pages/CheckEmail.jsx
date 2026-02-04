// src/pages/VerifyEmailPrompt.jsx
import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import useUserActions from "../hooks/user.actions";
import "../components/css/VerifyEmailPrompt.css";

function VerifyEmailPrompt() {
  const [resendStatus, setResendStatus] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const userActions = useUserActions();

  // Get email from localStorage (stored during registration)
  const authTemp = JSON.parse(localStorage.getItem("auth_temp"));
  const email = authTemp?.email;

  const handleResend = async () => {
    if (!email) return;
    
    setIsResending(true);
    setResendStatus(null);
    
    try {
      await userActions.resendVerificationEmail(email);
      setResendStatus({
        type: 'success',
        message: 'Verification email resent! Check your inbox.'
      });
    } catch (error) {
      setResendStatus({
        type: 'error',
        message: 'Failed to resend email. Try again later.'
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card text-center">
        {/* Email Icon */}
        <svg
          width="80"
          height="80"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="verify-email-icon"
        >
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
        </svg>

        {/* Title */}
        <h2 className="verify-email-title">Verify Your Email</h2>

        {/* Description */}
        <p className="verify-email-text">
          {email ? (
            <>
              We've sent a verification link to{" "}
              <span className="verify-email-address">{email}</span>. Please check your inbox.
            </>
          ) : (
            "We've sent a verification email. Please check your inbox."
          )}
        </p>
        
        <p className="verify-email-text">
          Click the link in the email to activate your account.
        </p>

        {/* Resend Button */}
        <Button 
          variant="primary" 
          onClick={handleResend}
          disabled={isResending}
          className="verify-email-resend-btn"
        >
          {isResending ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Sending...
            </>
          ) : (
            "Resend Verification Email"
          )}
        </Button>

        {/* Status Message */}
        {resendStatus && (
          <div className={`verify-email-status ${
            resendStatus.type === 'success' 
              ? 'verify-email-status-success' 
              : 'verify-email-status-error'
          }`}>
            {resendStatus.message}
          </div>
        )}

        {/* Back to Login Link */}
        <div className="mt-4">
          <Link to="/login/" className="verify-email-back-link">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPrompt;