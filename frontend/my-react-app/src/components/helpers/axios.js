import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { authManager } from "./authManager";

const axiosService = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ✅ Request interceptor - uses shared auth manager
axiosService.interceptors.request.use(
  (config) => {
    const accessToken = authManager.getAccessToken();
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor
axiosService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error("403 Forbidden:", error.config?.url);
    }
    return Promise.reject(error);
  }
);

// ✅ Token refresh logic
const refreshAuthLogic = async (failedRequest) => {
  const refreshToken = authManager.getRefreshToken();
  
  if (!refreshToken) {
    console.error("No refresh token available");
    authManager.clearAuth();
    window.location.href = "/login/";
    return Promise.reject(new Error("No refresh token"));
  }

  try {
    const response = await axios.post(
      "/api/auth/token/refresh/",
      { refresh: refreshToken },
      {
        baseURL: import.meta.env.VITE_API_URL,
        headers: { "Content-Type": "application/json" },
      }
    );

    const { access } = response.data;
    
    failedRequest.response.config.headers.Authorization = `Bearer ${access}`;
    authManager.updateTokens({ access });
    
    return Promise.resolve();
  } catch (error) {
    console.error("Token refresh failed:", error);
    authManager.clearAuth();
    window.location.href = "/login/";
    return Promise.reject(error);
  }
};

createAuthRefreshInterceptor(axiosService, refreshAuthLogic);

export function fetcher(url) {
  return axiosService.get(url).then((res) => res.data);
}

export default axiosService;