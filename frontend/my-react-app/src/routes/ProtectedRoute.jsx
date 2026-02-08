// components/ProtectedRoute.jsx

import React, { memo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../components/contexts/AuthContext";


function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login/" />;
}

// ✅ Prevent re-renders when parent updates
export default memo(ProtectedRoute);