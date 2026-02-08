// src/routes/ProtectedRoute.jsx
import React, { memo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/contexts/AuthContext";


function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // ✅ Save the attempted location for redirect after login
    return <Navigate to="/login/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default memo(ProtectedRoute);