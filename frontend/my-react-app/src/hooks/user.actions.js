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

  const getAccountSettings = useCallback(async () => (await axiosService.get("/api/auth/account/settings/")).data, []);

  // ----------------------
  // POSTS
  // ----------------------
  const getPosts = useCallback(async () => {
    const res = await axiosService.get("/api/post/");  // ✅ FIXED: /api/posts/ (plural)
    return res.data;
  }, []);

  const getPost = useCallback(async (postId) => {
    const res = await axiosService.get(`/api/post/${postId}/`);  // ✅ FIXED
    return res.data;
  }, []);

  const createPost = useCallback(async (data) => {
    const formData = new FormData();
    
    if (data.content) {
      formData.append("content", data.content);
    }
    
    if (data.media_files && data.media_files.length > 0) {
      data.media_files.forEach((file) => {
        formData.append("media_files", file);
      });
    }

    const res = await axiosService.post("/api/post/", formData, {  // ✅ FIXED
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }, []);

  const updatePost = useCallback(async (postId, data) => {
    const res = await axiosService.put(`/api/post/${postId}/`, data);  // ✅ FIXED
    return res.data;
  }, []);

  const deletePost = useCallback(async (postId) => {
    const res = await axiosService.delete(`/api/post/${postId}/`);  // ✅ FIXED
    return res.data;
  }, []);

  const getMyPosts = useCallback(async () => {
    const res = await axiosService.get("/api/post/my/");  // ✅ FIXED
    return res.data;
  }, []);

  const getUserPosts = useCallback(async (userId) => {
    const res = await axiosService.get(`/api/post/user/${userId}/`);  // ✅ FIXED
    return res.data;
  }, []);

  // ----------------------
  // LIKES
  // ----------------------
  const toggleLike = useCallback(async (postId) => {
    const res = await axiosService.post(`/api/likes/posts/${postId}/like/`);
    return res.data;
  }, []);

  const getPostLikes = useCallback(async (postId) => {
    const res = await axiosService.get(`/api/likes/posts/${postId}/likes/`);
    return res.data;
  }, []);

  const getMyLikes = useCallback(async () => {
    const res = await axiosService.get("/api/likes/my/");
    return res.data;
  }, []);

  // ----------------------
  // COMMENTS
  // ----------------------
  const getComments = useCallback(async (postId) => {
    const res = await axiosService.get(`/api/comment/posts/${postId}/comments/`);
    return res.data;
  }, []);

  const createComment = useCallback(async (postId, content, parentId = null) => {
    const data = { content };
    if (parentId) {
      data.parent_id = parentId;
    }
    const res = await axiosService.post(`/api/comment/posts/${postId}/comments/`, data);
    return res.data;
  }, []);

  const updateComment = useCallback(async (commentId, content) => {
    const res = await axiosService.put(`/api/comment/comments/${commentId}/update/`, { content });
    return res.data;
  }, []);

  const deleteComment = useCallback(async (commentId) => {
    const res = await axiosService.delete(`/api/comment/comments/${commentId}/delete/`);
    return res.data;
  }, []);

  const getCommentReplies = useCallback(async (commentId) => {
    const res = await axiosService.get(`/api/comment/comments/${commentId}/replies/`);
    return res.data;
  }, []);

  const getMyComments = useCallback(async () => {
    const res = await axiosService.get("/api/comment/my/");
    return res.data;
  }, []);

  // ----------------------
  // BOOKMARKS
  // ----------------------
  const toggleBookmark = useCallback(async (postId) => {
    const res = await axiosService.post(`/api/bookmarks/posts/${postId}/bookmark/`);
    return res.data;
  }, []);

  const getMyBookmarks = useCallback(async () => {
    const res = await axiosService.get("/api/bookmarks/my/");
    return res.data;
  }, []);

  const checkBookmark = useCallback(async (postId) => {
    const res = await axiosService.get(`/api/bookmarks/check/${postId}/`);
    return res.data;
  }, []);

  const removeBookmark = useCallback(async (bookmarkId) => {
    const res = await axiosService.delete(`/api/bookmarks/${bookmarkId}/`);
    return res.data;
  }, []);

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

    // account settings
    getAccountSettings,

    // posts
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    getMyPosts,
    getUserPosts,

    // likes
    toggleLike,
    getPostLikes,
    getMyLikes,

    // comments
    getComments,
    createComment,
    updateComment,
    deleteComment,
    getCommentReplies,
    getMyComments,

    // bookmarks
    toggleBookmark,
    getMyBookmarks,
    checkBookmark,
    removeBookmark,
  };
}

export default useUserActions;