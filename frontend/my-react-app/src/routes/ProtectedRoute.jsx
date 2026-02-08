import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../components/Authcontext";
import { Spinner, Container } from "react-bootstrap";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
}

export default ProtectedRoute;