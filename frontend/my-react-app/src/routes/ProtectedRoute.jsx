import React from "react";
import { Navigate } from "react-router-dom";
import useUserActions from "../hooks/user.actions"; // ✅ Default import (no curly braces)

function ProtectedRoute({ children }) {
  const userActions = useUserActions(); // ✅ Use the hook
  const user = userActions.getUser();   // ✅ Get user from hook
  
  return user ? <>{children}</> : <Navigate to="/login/" />;
}

export default ProtectedRoute;