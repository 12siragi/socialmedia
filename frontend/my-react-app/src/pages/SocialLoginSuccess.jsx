import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../components/Authcontext";

function SocialLoginSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");
    const email = searchParams.get("email");
    const firstName = searchParams.get("first_name");
    const lastName = searchParams.get("last_name");

    console.log("📍 SocialLoginSuccess - Received params:", {
      access: access ? "✅" : "❌",
      refresh: refresh ? "✅" : "❌",
      email,
      firstName,
      lastName
    });

    if (access && refresh) {
      try {
        // Store in localStorage
        const userData = {
          access,
          refresh,
          user: {
            email,
            first_name: firstName,
            last_name: lastName,
          },
        };

        localStorage.setItem("auth", JSON.stringify(userData));
        
        // ✅ Update Auth Context - this triggers ProtectedRoute re-render
        setUser(userData.user);
        
        console.log("✅ Tokens stored and context updated");

        // Navigate to home
        navigate("/", { replace: true });
        
      } catch (err) {
        console.error("❌ Error handling social login:", err);
        setError("Failed to complete login. Please try again.");
      }
    } else {
      // No tokens in URL - check for error
      const urlError = searchParams.get("error");
      console.error("❌ No tokens found. Error:", urlError);
      setError(urlError || "Authentication failed. Missing tokens.");
      
      // Redirect to login after showing error
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [searchParams, navigate, setUser]);

  if (error) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <Alert variant="danger" className="text-center">
          <h4>Authentication Error</h4>
          <p>{error}</p>
          <p className="mb-0">Redirecting to login...</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
      <p className="mt-3 text-muted">Completing login...</p>
    </Container>
  );
}

export default SocialLoginSuccess;