import React, { useState, useEffect } from "react";
import { Button, Row, Col, Spinner } from "react-bootstrap";
import useUserActions from "../../hooks/user.actions";

function SocialLoginButtons() {
  const userActions = useUserActions();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available providers from backend
    userActions
      .getSocialProviders()
      .then((data) => {
        setProviders(data.providers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch social providers:", err);
        // Set default providers even if API fails
        setProviders([
          { name: "google-oauth2", display_name: "Google" },
          { name: "github", display_name: "GitHub" },
        ]);
        setLoading(false);
      });
  }, []);

  const handleSocialLogin = (providerName) => {
    // Redirect to backend OAuth endpoint
    userActions.initiateSocialLogin(providerName);
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" variant="secondary" />
      </div>
    );
  }

  // SVG Icons
  const GoogleIcon = () => (
    <svg className="me-2" width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );

  const GitHubIcon = () => (
    <svg
      className="me-2"
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );

  const FacebookIcon = () => (
    <svg className="me-2" width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  const getIcon = (providerName) => {
    switch (providerName) {
      case "google-oauth2":
        return <GoogleIcon />;
      case "github":
        return <GitHubIcon />;
      case "facebook":
        return <FacebookIcon />;
      default:
        return null;
    }
  };

  return (
    <Row className="g-2">
      {providers.map((provider) => (
        <Col xs={providers.length === 1 ? 12 : 6} key={provider.name}>
          <Button
            variant="outline-secondary"
            className="w-100 d-flex align-items-center justify-content-center py-2 social-login-btn"
            onClick={() => handleSocialLogin(provider.name)}
          >
            {getIcon(provider.name)}
            {provider.display_name}
          </Button>
        </Col>
      ))}
    </Row>
  );
}

export default SocialLoginButtons;