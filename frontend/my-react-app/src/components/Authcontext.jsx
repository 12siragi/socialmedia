import React, { createContext, useContext, useState, useEffect } from "react";
import useUserActions from "../hooks/user.actions";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const userActions = useUserActions();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const currentUser = userActions.getUser();
      setUser(currentUser);
      setLoading(false);
    };

    initAuth();

    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === "auth") {
        const currentUser = userActions.getUser();
        setUser(currentUser);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (data) => {
    const result = await userActions.login(data);
    setUser(result.user);
    return result;
  };

  const logout = () => {
    userActions.logout();
    setUser(null);
  };

  const updateAuthUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: updateAuthUser,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};