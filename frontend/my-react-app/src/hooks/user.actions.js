// hooks/user.actions.js

import { useCallback } from "react";
import axiosService from "../components/helpers/axios";
import { authManager } from "../components/helpers/authManager";
import { useNavigate } from "react-router-dom";

function useUserActions() {
  const navigate = useNavigate();

  // ----------------------
  // AUTH
  // ----------------------
  const login = useCallback(async (data) => {
    const res = await axiosService.post("/api/auth/login/", data);
    authManager.setAuth(res.data);
    navigate("/");
    return res.data;
  }, [navigate]);

  const register = useCallback(async (data) => {
    authManager.setTempAuth({ email: data.email, message: "Registration in progress..." });
    navigate("/verify-email-prompt/");
    const res = await axiosService.post("/api/auth/register/", data);
    authManager.setTempAuth({ email: res.data.email || data.email, message: res.data.message || "Registration successful" });
    return res.data;
  }, [navigate]);

  const logout = useCallback(() => {
    const refresh = authManager.getRefreshToken();
    if (refresh) {
      axiosService.post("/api/auth/logout/", { refresh }).catch(console.error);
    }
    authManager.clearAuth();
    authManager.clearTempAuth();
    navigate("/login/");
  }, [navigate]);

  // ----------------------
  // USER INFO & PROFILE
  // ----------------------
  const getUser = useCallback(() => authManager.getUser(), []);
  const updateProfile = useCallback(async (data) => {
    const formData = new FormData();
    if (data.first_name) formData.append("first_name", data.first_name);
    if (data.last_name) formData.append("last_name", data.last_name);
    if (data.avatar) formData.append("avatar", data.avatar);

    const res = await axiosService.put("/api/auth/profile/update/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    authManager.updateUser(res.data.user);
    return res.data;
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    const res = await axiosService.post("/api/auth/password/change/", { old_password: oldPassword, new_password: newPassword });
    return res.data;
  }, []);

  const changeEmail = useCallback(async (newEmail, password) => {
    const res = await axiosService.post("/api/auth/email/change/", { new_email: newEmail, password });
    const currentUser = authManager.getUser();
    authManager.updateUser({ ...currentUser, email: newEmail, is_email_verified: false });
    return res.data;
  }, []);

  const deleteAccount = useCallback(async (password) => {
    const res = await axiosService.delete("/api/auth/account/delete/", { data: { password, confirm: "DELETE" } });
    authManager.clearAuth();
    navigate("/login/");
    return res.data;
  }, [navigate]);

  // ----------------------
  // PASSWORD & EMAIL RECOVERY
  // ----------------------
  const forgotPassword = useCallback(async (email) => {
    const res = await axiosService.post("/api/auth/forgot-password/", { email });
    return res.data;
  }, []);

  const resetPassword = useCallback(async (uid, token, password) => {
    const res = await axiosService.post("/api/auth/reset-password/", { uid, token, password });
    return res.data;
  }, []);

  const resendVerificationEmail = useCallback(async (email) => {
    const res = await axiosService.post("/api/auth/resend-verification-email/", { email });
    return res.data;
  }, []);

  // ----------------------
  // SOCIAL LOGIN
  // ----------------------
  const initiateSocialLogin = useCallback((provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/social/login/${provider}/`;
  }, []);

  const handleSocialLoginSuccess = useCallback((access, refresh, email, firstName, lastName) => {
    const userData = { access, refresh, user: { email, first_name: firstName, last_name: lastName } };
    authManager.setAuth(userData);
    return userData;
  }, []);

  const getSocialProviders = useCallback(async () => (await axiosService.get("/api/auth/social/providers/")).data, []);
  const getConnectedAccounts = useCallback(async () => (await axiosService.get("/api/auth/social/accounts/")).data, []);
  const disconnectSocialAccount = useCallback(async (provider) => (await axiosService.delete("/api/auth/social/accounts/", { data: { provider } })).data, []);

  // ----------------------
  // ACCOUNT SETTINGS
  // ----------------------
  const getAccountSettings = useCallback(async () => (await axiosService.get("/api/auth/account/settings/")).data, []);

  return {
    // auth
    login,
    register,
    logout,
    getUser,

    // profile
    updateProfile,
    changePassword,
    changeEmail,
    deleteAccount,

    // recovery
    forgotPassword,
    resetPassword,
    resendVerificationEmail,

    // social
    initiateSocialLogin,
    handleSocialLoginSuccess,
    getSocialProviders,
    getConnectedAccounts,
    disconnectSocialAccount,

    // account settings
    getAccountSettings,
  };
}

export default useUserActions;
