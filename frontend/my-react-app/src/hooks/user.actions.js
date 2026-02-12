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

  // ================================================================================================
  // ✅ NEW USER MANAGEMENT ACTIONS
  // ================================================================================================

  /**
   * Get account settings summary
   */
  const getAccountSettings = useCallback(async () => {
    try {
      const res = await axiosService.get(`/api/auth/account/settings/`);
      return res.data;
    } catch (error) {
      console.error("Get account settings error:", error);
      throw error;
    }
  }, []);

  /**
   * Update profile (name, avatar)
   */
  const updateProfile = useCallback(async (data) => {
    try {
      const formData = new FormData();
      
      if (data.first_name) formData.append('first_name', data.first_name);
      if (data.last_name) formData.append('last_name', data.last_name);
      if (data.avatar) formData.append('avatar', data.avatar);

      const res = await axiosService.put(`/api/auth/profile/update/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user in auth manager
      authManager.updateUser(res.data.user);
      
      return res.data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }, []);

  /**
   * Change password (requires current password)
   */
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      const res = await axiosService.post(`/api/auth/password/change/`, {
        old_password: oldPassword,
        new_password: newPassword,
      });
      
      return res.data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }, []);

  /**
   * Change email (requires password confirmation)
   */
  const changeEmail = useCallback(async (newEmail, password) => {
    try {
      const res = await axiosService.post(`/api/auth/email/change/`, {
        new_email: newEmail,
        password: password,
      });
      
      // Update user email in auth manager
      const currentUser = authManager.getUser();
      authManager.updateUser({
        ...currentUser,
        email: newEmail,
        is_email_verified: false, // Backend sets this to false
      });
      
      return res.data;
    } catch (error) {
      console.error("Change email error:", error);
      throw error;
    }
  }, []);

  /**
   * Delete account (IRREVERSIBLE)
   */
  const deleteAccount = useCallback(async (password) => {
    try {
      const res = await axiosService.delete(`/api/auth/account/delete/`, {
        data: {
          password: password,
          confirm: "DELETE",
        },
      });
      
      // Clear auth and redirect to login
      authManager.clearAuth();
      navigate("/login/");
      
      return res.data;
    } catch (error) {
      console.error("Delete account error:", error);
      throw error;
    }
  }, [navigate]);

  /**
   * Get connected social accounts (detailed)
   */
  const getConnectedAccountsDetailed = useCallback(async () => {
    try {
      const res = await axiosService.get(`/api/auth/account/connected/`);
      return res.data;
    } catch (error) {
      console.error("Get connected accounts detailed error:", error);
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
    // Auth actions
    login,
    register,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
    refreshAccessToken,
    
    // User info
    getUser,
    getAccessToken,
    getRefreshToken,
    isAuthenticated,
    clearTempAuth,
    
    // Social auth
    initiateSocialLogin,
    handleSocialLoginSuccess,
    getSocialProviders,
    getConnectedAccounts,
    disconnectSocialAccount,
    
    // ✅ NEW: User management
    getAccountSettings,
    updateProfile,
    changePassword,
    changeEmail,
    deleteAccount,
    getConnectedAccountsDetailed,
  };
}

export default useUserActions;