// components/helpers/authManager.js

class AuthManager {
  constructor() {
    this.cachedAuth = null;
    this.lastAuthCheck = 0;
    this.AUTH_CACHE_TTL = 5000; // 5 seconds
    this.listeners = new Set(); // ✅ Track listeners for re-renders
  }

  // ✅ Subscribe/unsubscribe pattern
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback); // Return unsubscribe function
  }

  // ✅ Notify all listeners when auth changes
  notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  // ✅ Single source of truth for auth data
  getAuth() {
    const now = Date.now();
    
    if (this.cachedAuth && (now - this.lastAuthCheck) < this.AUTH_CACHE_TTL) {
      return this.cachedAuth;
    }
    
    try {
      const authStr = localStorage.getItem("auth");
      this.cachedAuth = authStr ? JSON.parse(authStr) : null;
      this.lastAuthCheck = now;
      return this.cachedAuth;
    } catch (error) {
      console.error("Error parsing auth:", error);
      this.cachedAuth = null;
      return null;
    }
  }

  // ✅ Optimized getters
  getAccessToken() {
    return this.getAuth()?.access || null;
  }

  getRefreshToken() {
    return this.getAuth()?.refresh || null;
  }

  getUser() {
    return this.getAuth()?.user || null;
  }

  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // ✅ Setters with notifications
  setAuth(data) {
    try {
      const authData = {
        access: data.tokens?.access || data.access,
        refresh: data.tokens?.refresh || data.refresh,
        user: data.user || data,
      };
      
      localStorage.setItem("auth", JSON.stringify(authData));
      this.cachedAuth = authData;
      this.lastAuthCheck = Date.now();
      
      // ✅ Trigger re-renders
      this.notifyListeners();
      
      return authData;
    } catch (error) {
      console.error("Error setting auth:", error);
      throw error;
    }
  }

  updateTokens(updates) {
    const auth = this.getAuth() || {};
    const newAuth = { ...auth, ...updates };
    
    localStorage.setItem("auth", JSON.stringify(newAuth));
    this.cachedAuth = newAuth;
    this.lastAuthCheck = Date.now();
    
    // ✅ Trigger re-renders
    this.notifyListeners();
    
    return newAuth;
  }

  updateUser(userData) {
    return this.updateTokens({ user: userData });
  }

  clearAuth() {
    localStorage.removeItem("auth");
    this.cachedAuth = null;
    this.lastAuthCheck = 0;
    
    // ✅ Trigger re-renders
    this.notifyListeners();
  }

  clearCache() {
    this.cachedAuth = null;
    this.lastAuthCheck = 0;
  }

  // ✅ Temp auth helpers
  setTempAuth(data) {
    localStorage.setItem("auth_temp", JSON.stringify(data));
  }

  getTempAuth() {
    try {
      const temp = localStorage.getItem("auth_temp");
      return temp ? JSON.parse(temp) : null;
    } catch (error) {
      console.error("Error getting temp auth:", error);
      return null;
    }
  }

  clearTempAuth() {
    localStorage.removeItem("auth_temp");
  }
}

// ✅ Singleton instance
export const authManager = new AuthManager();