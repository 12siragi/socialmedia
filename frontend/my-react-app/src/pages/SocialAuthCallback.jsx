// src/pages/SocialAuthCallback.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useUserActions from "../hooks/user.actions";

function SocialAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userActions = useUserActions();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens and user info from URL params
        const access = searchParams.get("access");
        const refresh = searchParams.get("refresh");
        const email = searchParams.get("email");
        const firstName = searchParams.get("firstName");
        const lastName = searchParams.get("lastName");
        const error = searchParams.get("error");

        // Check for errors
        if (error) {
          console.error("Social auth error:", error);
          navigate("/login?error=" + error);
          return;
        }

        // Verify we have tokens
        if (!access || !refresh) {
          console.error("Missing authentication tokens");
          navigate("/login?error=missing_tokens");
          return;
        }

        // Store tokens and user data
        userActions.handleSocialLoginSuccess(
          access,
          refresh,
          email,
          firstName,
          lastName
        );

        // Redirect to home
        navigate("/");
      } catch (err) {
        console.error("Error handling social auth callback:", err);
        navigate("/login?error=callback_failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate, userActions]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Completing sign in...</p>
      </div>
    </div>
  );
}

export default SocialAuthCallback;