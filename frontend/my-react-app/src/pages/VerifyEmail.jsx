// src/pages/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import useUserActions from "../hooks/user.actions";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  
  const { verifyEmail } = useUserActions();

  useEffect(() => {
    const handleVerification = async () => {
      // Step 1: Get token from URL
      const token = searchParams.get('token');

      // Step 2: No token? Invalid link
      if (!token) {
        setStatus('error');
        setTimeout(() => navigate('/email-verify-failed/'), 2000);
        return;
      }

      // Step 3: Send token to backend
      try {
        await verifyEmail(token);
        
        // Success!
        setStatus('success');
        setTimeout(() => navigate('/email-verified-success/'), 1500);
        
      } catch (error) {
        // Failed!
        console.error('Verification error:', error);
        setStatus('error');
        setTimeout(() => navigate('/email-verify-failed/'), 2000);
      }
    };

    handleVerification();
  }, [searchParams, navigate, verifyEmail]);

  return (
    <div 
      className="d-flex align-items-center justify-content-center min-vh-100" 
      style={{ backgroundColor: '#0f1118' }}
    >
      <div className="text-center text-white">
        
        {/* VERIFYING STATE */}
        {status === 'verifying' && (
          <>
            <Spinner 
              animation="border" 
              variant="primary" 
              style={{ width: '3rem', height: '3rem' }} 
            />
            <h3 className="mt-3">Verifying your email...</h3>
            <p className="text-muted">Please wait</p>
          </>
        )}
        
        {/* SUCCESS STATE */}
        {status === 'success' && (
          <>
            <div className="text-success mb-3">
              <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
            </div>
            <h3 className="text-success">Email Verified!</h3>
            <p className="text-muted">Redirecting...</p>
          </>
        )}
        
        {/* ERROR STATE */}
        {status === 'error' && (
          <>
            <div className="text-danger mb-3">
              <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
              </svg>
            </div>
            <h3 className="text-danger">Verification Failed</h3>
            <p className="text-muted">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;