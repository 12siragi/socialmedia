// src/pages/SocialLoginSuccess.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Spinner, Alert } from "react-bootstrap";
import { authManager } from "../components/helpers/authManager";

function SocialLoginSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleSocialAuth = () => {
      // Get URL parameters
      const access = searchParams.get("access");
      const refresh = searchParams.get("refresh");
      const email = searchParams.get("email");
      const firstName = searchParams.get("first_name");
      const lastName = searchParams.get("last_name");
      const urlError = searchParams.get("error");

      // Check for errors first
      if (urlError) {
        setError(urlError);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      // Validate required tokens
      if (!access || !refresh) {
        setError("Authentication failed. Missing tokens.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      try {
        // ✅ Store auth data directly using authManager
        authManager.setAuth({
          access,
          refresh,
          user: {
            email,
            first_name: firstName,
            last_name: lastName,
          },
        });

        // ✅ Navigate immediately (authManager.setAuth already triggers re-render)
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Error handling social login:", err);
        setError("Failed to complete login. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleSocialAuth();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <Container 
        className="d-flex flex-column align-items-center justify-content-center" 
        style={{ minHeight: "100vh", backgroundColor: "#0f1118" }}
      >
        <Alert variant="danger" className="text-center">
          <h4>Authentication Error</h4>
          <p>{error}</p>
          <p className="mb-0">Redirecting to login...</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container 
      className="d-flex flex-column align-items-center justify-content-center" 
      style={{ minHeight: "100vh", backgroundColor: "#0f1118" }}
    >
      <Spinner 
        animation="border" 
        variant="primary" 
        style={{ width: "3rem", height: "3rem" }} 
      />
      <p className="mt-3" style={{ color: "#8e8e93" }}>
        Completing login...
      </p>
    </Container>
  );
}

export default SocialLoginSuccess;