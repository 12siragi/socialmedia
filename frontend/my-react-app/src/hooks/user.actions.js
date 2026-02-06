import axiosService from "../components/helpers/axios";
import { useNavigate } from "react-router-dom";

function useUserActions() {
  const navigate = useNavigate();

  // ---------------- LOGIN ----------------
  const login = async (data) => {
    try {
      const res = await axiosService.post(`/api/auth/login/`, data);
      setUserData(res.data);
      navigate("/");
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // ---------------- SOCIAL LOGIN ----------------
  const initiateSocialLogin = (provider) => {
    // Redirect to backend OAuth endpoint
    // Backend will handle OAuth flow and redirect back to success page
    const backendUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${backendUrl}/api/auth/social/login/${provider}/`;
  };

  // ---------------- HANDLE SOCIAL LOGIN SUCCESS ----------------
  const handleSocialLoginSuccess = (access, refresh, email, firstName, lastName) => {
    try {
      // Store tokens and user data
      const userData = {
        access,
        refresh,
        user: {
          email,
          first_name: firstName,
          last_name: lastName,
        },
      };
      
      setUserData(userData);
      return userData;
    } catch (error) {
      console.error("Social login success handler error:", error);
      throw error;
    }
  };

  // ---------------- GET SOCIAL PROVIDERS ----------------
  const getSocialProviders = async () => {
    try {
      const res = await axiosService.get(`/api/auth/social/providers/`);
      return res.data;
    } catch (error) {
      console.error("Get social providers error:", error);
      throw error;
    }
  };

  // ---------------- GET CONNECTED SOCIAL ACCOUNTS ----------------
  const getConnectedAccounts = async () => {
    try {
      const res = await axiosService.get(`/api/auth/social/accounts/`);
      return res.data;
    } catch (error) {
      console.error("Get connected accounts error:", error);
      throw error;
    }
  };

  // ---------------- DISCONNECT SOCIAL ACCOUNT ----------------
  const disconnectSocialAccount = async (provider) => {
    try {
      const res = await axiosService.delete(`/api/auth/social/accounts/`, {
        data: { provider },
      });
      return res.data;
    } catch (error) {
      console.error("Disconnect social account error:", error);
      throw error;
    }
  };

  // ---------------- REGISTER ----------------
  const register = async (data) => {
    try {
      localStorage.setItem(
        "auth_temp",
        JSON.stringify({
          email: data.email,
          message: "Registration in progress...",
        })
      );

      navigate("/verify-email-prompt/");

      const res = await axiosService.post(`/api/auth/register/`, data);

      localStorage.setItem(
        "auth_temp",
        JSON.stringify({
          email: res.data.email || data.email,
          message: res.data.message || "Registration successful",
        })
      );

      return res.data;
    } catch (error) {
      console.error("Registration error:", error);
      
      localStorage.setItem(
        "auth_temp",
        JSON.stringify({
          email: data.email,
          error: error.response?.data?.detail || "Registration failed",
        })
      );
      
      throw error;
    }
  };

  // ---------------- RESEND VERIFICATION EMAIL ----------------
  const resendVerificationEmail = async (email) => {
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
  };

  // ---------------- FORGOT PASSWORD ----------------
  const forgotPassword = async (email) => {
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
  };

  // ---------------- RESET PASSWORD ----------------
  const resetPassword = async (uid, token, password) => {
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
  };

  // ---------------- LOGOUT ----------------
  const logout = () => {
    try {
      localStorage.removeItem("auth");
      localStorage.removeItem("auth_temp");
      navigate("/login/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ---------------- UPDATE USER ----------------
  const updateUser = async (userId, data) => {
    try {
      const res = await axiosService.patch(
        `/api/auth/user/${userId}/`,
        data
      );

      const auth = JSON.parse(localStorage.getItem("auth")) || {};
      localStorage.setItem(
        "auth",
        JSON.stringify({
          ...auth,
          user: res.data,
        })
      );

      return res.data;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  // ---------------- REFRESH TOKEN ----------------
  const refreshAccessToken = async () => {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      const res = await axiosService.post(`/api/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const auth = JSON.parse(localStorage.getItem("auth")) || {};
      localStorage.setItem(
        "auth",
        JSON.stringify({
          ...auth,
          access: res.data.access,
        })
      );

      return res.data.access;
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      throw error;
    }
  };

  // ---------------- HELPERS ----------------
  const setUserData = (data) => {
    try {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          access: data.tokens?.access || data.access,
          refresh: data.tokens?.refresh || data.refresh,
          user: data.user || data,
        })
      );
    } catch (error) {
      console.error("Error setting user data:", error);
    }
  };

  const getUser = () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      return auth?.user || null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  };

  const getAccessToken = () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      return auth?.access || null;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  const getRefreshToken = () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      return auth?.refresh || null;
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  };

  const isAuthenticated = () => {
    const token = getAccessToken();
    return !!token;
  };

  const clearTempAuth = () => {
    try {
      localStorage.removeItem("auth_temp");
    } catch (error) {
      console.error("Error clearing temp auth:", error);
    }
  };

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
    // ✅ New social auth functions
    initiateSocialLogin,
    handleSocialLoginSuccess,
    getSocialProviders,
    getConnectedAccounts,
    disconnectSocialAccount,
  };
}

export default useUserActions;