// contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authManager } from "../helpers/authManager";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ✅ Initialize from authManager
  const [authState, setAuthState] = useState(() => ({
    user: authManager.getUser(),
    isAuthenticated: authManager.isAuthenticated(),
  }));

  // ✅ Subscribe to auth changes
  useEffect(() => {
    const updateAuthState = () => {
      setAuthState({
        user: authManager.getUser(),
        isAuthenticated: authManager.isAuthenticated(),
      });
    };

    // Subscribe to authManager changes
    const unsubscribe = authManager.subscribe(updateAuthState);

    return unsubscribe;
  }, []);

  // ✅ Memoize value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
  }), [authState.user, authState.isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}