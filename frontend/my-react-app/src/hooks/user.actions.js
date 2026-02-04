import axios from "axios";
import { useNavigate } from "react-router-dom";

function useUserActions() {
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_API_URL;

  // ---------------- LOGIN ----------------
  const login = async (data) => {
    try {
      const res = await axios.post(`${baseURL}/api/auth/login/`, data);
      setUserData(res.data);
      navigate("/");
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
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

      const res = await axios.post(`${baseURL}/api/auth/register/`, data);

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
      const res = await axios.post(
        `${baseURL}/api/auth/resend-verification-email/`,
        { email }
      );
      return res.data;
    } catch (error) {
      console.error("Resend verification error:", error);
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
      const accessToken = getAccessToken();
      
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const res = await axios.patch(
        `${baseURL}/api/auth/user/${userId}/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
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

      const res = await axios.post(`${baseURL}/api/auth/token/refresh/`, {
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
    logout,
    updateUser,
    refreshAccessToken,
    getUser,
    getAccessToken,
    getRefreshToken,
    isAuthenticated,
    clearTempAuth,
  };
}

export default useUserActions;