import axios from "axios";
import { useNavigate } from "react-router-dom";

function useUserActions() {
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_API_URL;

  // ---------------- LOGIN ----------------
  const login = async (data) => {
    const res = await axios.post(`${baseURL}/api/auth/login/`, data);
    setUserData(res.data);
    navigate("/");
    return res.data;
  };

  // ---------------- REGISTER ----------------
  const register = async (data) => {
    const res = await axios.post(`${baseURL}/api/auth/register/`, data);

    // Instead of automatically logging in, store minimal data
    localStorage.setItem(
      "auth_temp",
      JSON.stringify({
        email: res.email,
        message: res.message,
      })
    );

    // Navigate to a "Check your email" page
    navigate("/verify-email-prompt/");
    return res.data;
  };

  // ---------------- VERIFY EMAIL ----------------
  const verifyEmail = async (uid, token) => {
    try {
      const res = await axios.get(
        `${baseURL}/api/auth/verify-email/?uid=${uid}&token=${token}`
      );
      return res.data; // e.g., success message
    } catch (error) {
      throw error;
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = () => {
    localStorage.removeItem("auth");
    navigate("/login/");
  };

  // ---------------- UPDATE USER ----------------
  const updateUser = async (userId, data) => {
    const res = await axios.patch(`${baseURL}/auth/user/${userId}/`, data, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    const auth = JSON.parse(localStorage.getItem("auth")) || {};
    localStorage.setItem(
      "auth",
      JSON.stringify({
        ...auth,
        user: res.data,
      })
    );

    return res.data;
  };

  // ---------------- HELPERS ----------------
  const setUserData = (data) => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        access: data.tokens.access,
        refresh: data.tokens.refresh,
        user: data,
      })
    );
  };

  const getUser = () => {
    const auth = JSON.parse(localStorage.getItem("auth"));
    return auth?.user;
  };

  const getAccessToken = () => {
    const auth = JSON.parse(localStorage.getItem("auth"));
    return auth?.access;
  };

  const getRefreshToken = () => {
    const auth = JSON.parse(localStorage.getItem("auth"));
    return auth?.refresh;
  };

  return {
    login,
    register,
    verifyEmail,
    logout,
    updateUser,
    getUser,
    getAccessToken,
    getRefreshToken,
  };
}

export default useUserActions;
