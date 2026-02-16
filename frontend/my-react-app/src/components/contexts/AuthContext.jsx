// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authManager } from '../helpers/authManager';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize from authManager
  const [authState, setAuthState] = useState(() => ({
    user: authManager.getUser(),
    isAuthenticated: authManager.isAuthenticated(),
  }));

  const [loading, setLoading] = useState(true);

  // Subscribe to authManager changes
  useEffect(() => {
    const updateAuthState = () => {
      setAuthState({
        user: authManager.getUser(),
        isAuthenticated: authManager.isAuthenticated(),
      });
    };

    setLoading(false);
    
    // Your authManager already has subscribe/notifyListeners!
    const unsubscribe = authManager.subscribe(updateAuthState);
    
    return unsubscribe;
  }, []);

  // Memoize to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading,
  }), [authState.user, authState.isAuthenticated, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}