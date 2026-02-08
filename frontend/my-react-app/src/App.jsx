import React from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/Home";
import Registration from "./pages/Registration";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import VerifyEmail from "./pages/VerifyEmail";
import CheckEmail from "./pages/CheckEmail";
import EmailVerifiedSuccess from "./pages/EmailVerifiedSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordFailed from "./pages/ResetPasswordFailed";
import SocialLoginSuccess from "./pages/SocialLoginSuccess";

function App() {
  return (
    <Routes>
      {/* ---------------- PUBLIC ROUTES ---------------- */}
      <Route path="/login/" element={<Login />} />
      <Route path="/register/" element={<Registration />} />

      {/* Email verification routes */}
      <Route path="/verify-email-prompt/" element={<CheckEmail />} />
      <Route path="/email-verify-failed" element={<VerifyEmail />} />
      <Route path="/email-verified-success/" element={<EmailVerifiedSuccess />} />

      {/* ✅ NEW: Social auth success callback route */}
      <Route path="/social-login-success" element={<SocialLoginSuccess />} />

      {/* Password reset routes */}
      <Route path="/forgot-password/" element={<ForgotPassword />} />
      <Route path="/reset-password/" element={<ResetPassword />} />
      <Route path="/reset-password-failed/" element={<ResetPasswordFailed />} />

      {/* ---------------- PROTECTED ROUTES ---------------- */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId/"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:profileId/edit/"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* Optional: 404 catch-all route */}
      <Route
        path="*"
        element={
          <div style={{ textAlign: "center", marginTop: "80px" }}>
            <h2>404 - Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;