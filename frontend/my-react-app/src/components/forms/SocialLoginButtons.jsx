// src/components/forms/SocialLoginButtons.jsx
import React, { useCallback, memo } from "react";
import { Button, Row, Col } from "react-bootstrap";

function SocialLoginButtons({ disabled = false }) {
  // ✅ Direct implementation, no hook needed
  const handleSocialLogin = useCallback((providerName) => {
    const backendUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${backendUrl}/api/auth/social/login/${providerName}/`;
  }, []);

  // SVG Icons remain the same...
  const GoogleIcon = () => (
    <svg className="me-2" width="18" height="18" viewBox="0 0 18 18">
      {/* ... */}
    </svg>
  );

  const GitHubIcon = () => (
    <svg className="me-2" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
      {/* ... */}
    </svg>
  );

  return (
    <Row className="g-2">
      <Col xs={6}>
        <Button
          variant="outline-secondary"
          className="w-100 d-flex align-items-center justify-content-center py-2 social-login-btn"
          onClick={() => handleSocialLogin("google-oauth2")}
          disabled={disabled}
        >
          <GoogleIcon />
          Google
        </Button>
      </Col>
      <Col xs={6}>
        <Button
          variant="outline-secondary"
          className="w-100 d-flex align-items-center justify-content-center py-2 social-login-btn"
          onClick={() => handleSocialLogin("github")}
          disabled={disabled}
        >
          <GitHubIcon />
          GitHub
        </Button>
      </Col>
    </Row>
  );
}

export default memo(SocialLoginButtons);