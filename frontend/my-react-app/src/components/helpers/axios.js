import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";

// ✅ Fixed token getter functions
const getAccessToken = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  // Check multiple possible locations for tokens
  return auth?.access || auth?.user?.tokens?.access || auth?.tokens?.access;
};

const getRefreshToken = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  // Check multiple possible locations for tokens
  return auth?.refresh || auth?.user?.tokens?.refresh || auth?.tokens?.refresh;
};

// Create axios instance with base URL and headers
const axiosService = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Enhanced request interceptor with debugging
axiosService.interceptors.request.use(async (config) => {
  const accessToken = getAccessToken();
  
  console.log("🔑 Checking for access token...");
  console.log("🔑 Token found:", accessToken ? "YES" : "NO");
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    console.log("✅ Authorization header added:", `Bearer ${accessToken.substring(0, 20)}...`);
  } else {
    console.log("❌ No access token found in localStorage");
    console.log("📦 Auth data:", JSON.parse(localStorage.getItem("auth")));
  }
  
  return config;
});

// ✅ Enhanced response interceptor with debugging
axiosService.interceptors.response.use(
  (res) => {
    console.log("✅ Request successful:", res.config.url);
    return Promise.resolve(res);
  },
  (err) => {
    console.log("🚨 Request failed:", err.config?.url, err.response?.status);
    if (err.response?.status === 403) {
      console.log("🚨 403 Forbidden - Check if Authorization header was sent");
      console.log("🚨 Request headers:", err.config?.headers);
    }
    return Promise.reject(err);
  }
);

const refreshAuthLogic = async (failedRequest) => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.log("❌ No refresh token available");
    return Promise.reject("No refresh token available");
  }

  return axios
    .post("/api/auth/token/refresh/", {  // ✅ Fixed endpoint
      refresh: refreshToken,
    }, {
      baseURL: "http://localhost:8000",
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((resp) => {
      const { access, refresh, user } = resp.data;
      failedRequest.response.config.headers["Authorization"] = "Bearer " + access;
      
      // ✅ Store tokens in the same format as your current structure
      const auth = JSON.parse(localStorage.getItem("auth"));
      if (auth?.user?.tokens) {
        auth.user.tokens.access = access;
        auth.user.tokens.refresh = refresh;
      } else {
        // Fallback to root level
        Object.assign(auth, { access, refresh, user });
      }
      
      localStorage.setItem("auth", JSON.stringify(auth));
      console.log("✅ Tokens refreshed successfully");
    })
    .catch(() => {
      console.log("❌ Token refresh failed, logging out user");
      localStorage.removeItem("auth");
      window.location.href = "/login/";
    });
};

createAuthRefreshInterceptor(axiosService, refreshAuthLogic);

export function fetcher(url) {
  return axiosService.get(url).then((res) => res.data);
}

export default axiosService;