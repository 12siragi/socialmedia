// hooks/user.actions.js

import { useCallback } from "react";
import axiosService from "../components/helpers/axios";
import { authManager } from "../components/helpers/authManager";
import { useNavigate } from "react-router-dom";

function useUserActions() {
  const navigate = useNavigate();

  const login = useCallback(async (data) => {
    try {
      const res = await axiosService.post(`/api/auth/login/`, data);
      authManager.setAuth(res.data); // ✅ Automatically triggers re-render
      navigate("/");
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, [navigate]);

  const register = useCallback(async (data) => {
    try {
      authManager.setTempAuth({
        email: data.email,
        message: "Registration in progress...",
      });

      navigate("/verify-email-prompt/");

      const res = await axiosService.post(`/api/auth/register/`, data);

      authManager.setTempAuth({
        email: res.data.email || data.email,
        message: res.data.message || "Registration successful",
      });

      return res.data;
    } catch (error) {
      console.error("Registration error:", error);
      
      authManager.setTempAuth({
        email: data.email,
        error: error.response?.data?.detail || "Registration failed",
      });
      
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    try {
      authManager.clearAuth(); // ✅ Automatically triggers re-render
      authManager.clearTempAuth();
      navigate("/login/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [navigate]);

  const updateUser = useCallback(async (userId, data) => {
    try {
      const res = await axiosService.patch(
        `/api/auth/user/${userId}/`,
        data
      );

      authManager.updateUser(res.data); // ✅ Automatically triggers re-render
      return res.data;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = authManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      const res = await axiosService.post(`/api/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      authManager.updateTokens({ access: res.data.access }); // ✅ Automatically triggers re-render
      return res.data.access;
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      throw error;
    }
  }, [logout]);

  const resendVerificationEmail = useCallback(async (email) => {
    try {
      const res = await axiosService.post(
        `/api/auth/resend-verification-email/`,
        { email }
      );
      return res.data;
    } catch (error) {
      console.error("Resend verification error:", error);
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const res = await axiosService.post(
        `/api/auth/forgot-password/`,
        { email }
      );
      return res.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (uid, token, password) => {
    try {
      const res = await axiosService.post(
        `/api/auth/reset-password/`,
        { uid, token, password }
      );
      return res.data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }, []);

  const initiateSocialLogin = useCallback((provider) => {
    const backendUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${backendUrl}/api/auth/social/login/${provider}/`;
  }, []);

  const handleSocialLoginSuccess = useCallback((access, refresh, email, firstName, lastName) => {
    try {
      const userData = {
        access,
        refresh,
        user: {
          email,
          first_name: firstName,
          last_name: lastName,
        },
      };
      
      authManager.setAuth(userData); // ✅ Automatically triggers re-render
      return userData;
    } catch (error) {
      console.error("Social login success handler error:", error);
      throw error;
    }
  }, []);

  const getSocialProviders = useCallback(async () => {
    try {
      const res = await axiosService.get(`/api/auth/social/providers/`);
      return res.data;
    } catch (error) {
      console.error("Get social providers error:", error);
      throw error;
    }
  }, []);

  const getConnectedAccounts = useCallback(async () => {
    try {
      const res = await axiosService.get(`/api/auth/social/accounts/`);
      return res.data;
    } catch (error) {
      console.error("Get connected accounts error:", error);
      throw error;
    }
  }, []);

  const disconnectSocialAccount = useCallback(async (provider) => {
    try {
      const res = await axiosService.delete(`/api/auth/social/accounts/`, {
        data: { provider },
      });
      return res.data;
    } catch (error) {
      console.error("Disconnect social account error:", error);
      throw error;
    }
  }, []);

  // ✅ Simple getters that read from authManager
  const getUser = useCallback(() => authManager.getUser(), []);
  const getAccessToken = useCallback(() => authManager.getAccessToken(), []);
  const getRefreshToken = useCallback(() => authManager.getRefreshToken(), []);
  const isAuthenticated = useCallback(() => authManager.isAuthenticated(), []);
  const clearTempAuth = useCallback(() => authManager.clearTempAuth(), []);

  return {
    login,
    register,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
    refreshAccessToken,
    getUser,
    getAccessToken,
    getRefreshToken,
    isAuthenticated,
    clearTempAuth,
    initiateSocialLogin,
    handleSocialLoginSuccess,
    getSocialProviders,
    getConnectedAccounts,
    disconnectSocialAccount,
  };
}

export default useUserActions;