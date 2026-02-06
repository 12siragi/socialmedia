import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";

// ✅ Fixed token getter functions - matches user.actions.js structure
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

// Create axios instance with base URL and headers
const axiosService = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor - adds Authorization header
axiosService.interceptors.request.use(
  async (config) => {
    const accessToken = getAccessToken();
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - handles errors
axiosService.interceptors.response.use(
  (response) => {
    return Promise.resolve(response);
  },
  (error) => {
    // Log 403 errors for debugging
    if (error.response?.status === 403) {
      console.error("403 Forbidden:", error.config?.url);
      console.error("Check authentication token");
    }
    return Promise.reject(error);
  }
);

// ✅ Token refresh logic
const refreshAuthLogic = async (failedRequest) => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.error("No refresh token available");
    localStorage.removeItem("auth");
    window.location.href = "/login/";
    return Promise.reject("No refresh token available");
  }

  try {
    const response = await axios.post(
      "/api/auth/token/refresh/",
      { refresh: refreshToken },
      {
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { access } = response.data;
    
    // Update the failed request with new token
    failedRequest.response.config.headers["Authorization"] = `Bearer ${access}`;
    
    // Update localStorage with new access token
    const auth = JSON.parse(localStorage.getItem("auth"));
    localStorage.setItem(
      "auth",
      JSON.stringify({
        ...auth,
        access: access,
      })
    );

    return Promise.resolve();
  } catch (error) {
    console.error("Token refresh failed:", error);
    localStorage.removeItem("auth");
    window.location.href = "/login/";
    return Promise.reject(error);
  }
};

// Attach the refresh interceptor
createAuthRefreshInterceptor(axiosService, refreshAuthLogic);

// Fetcher function for SWR or other data fetching libraries
export function fetcher(url) {
  return axiosService.get(url).then((res) => res.data);
}

export default axiosService;