import axios from "axios";
import { useNavigate } from "react-router-dom";

function useUserActions() {
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_API_URL;

  // ---------------- LOGIN ----------------
  const login = async (data) => {
    const res = await axios.post(`${baseURL}/api/auth/login/`, data);
    // Store user and tokens in localStorage
    setUserData(res.data);
    navigate("/");
    return res.data;
  };

  // ---------------- REGISTER ----------------
  const register = async (data) => {
    const res = await axios.post(`${baseURL}/api/auth/register/`, data);
    setUserData(res.data);
    navigate("/");
    return res.data;
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

    // Update user in localStorage
    const auth = JSON.parse(localStorage.getItem("auth")) || {};
    localStorage.setItem(
      "auth",
      JSON.stringify({
        ...auth,
        user: res.data, // updated user including full avatar URL
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
        user: data, // includes full avatar URL from serializer
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
    logout,
    updateUser,
    getUser,
    getAccessToken,
    getRefreshToken,
  };
}

export default useUserActions;
