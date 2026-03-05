// src/App.jsx
import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from './components/contexts/AuthContext';
import ProtectedRoute from "./routes/ProtectedRoute";

// ✅ Eager load auth-related pages (small, needed immediately)
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import AccountSettings from "./pages/AccountSettings";

// ✅ Lazy load everything else
const Home = lazy(() => import("./pages/Home"));
const Messages = lazy(() => import("./pages/Messages"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const CheckEmail = lazy(() => import("./pages/CheckEmail"));
const EmailVerifyFailed = lazy(() => import("./pages/EmailVerifyFailed"));
const EmailVerifiedSuccess = lazy(() => import("./pages/EmailVerifiedSuccess"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ResetPasswordFailed = lazy(() => import("./pages/ResetPasswordFailed"));
const SocialLoginSuccess = lazy(() => import("./pages/SocialLoginSuccess"));

// ✅ Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f1118'
  }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/login/" element={<Login />} />
          <Route path="/register/" element={<Registration />} />
          <Route path="/verify-email-prompt/" element={<CheckEmail />} />
          <Route path="/email-verify/" element={<VerifyEmail />} />
          <Route path="/email-verified-success/" element={<EmailVerifiedSuccess />} />
          <Route path="/email-verify-failed/" element={<EmailVerifyFailed />} />
          <Route path="/social-login-success" element={<SocialLoginSuccess />} />
          <Route path="/forgot-password/" element={<ForgotPassword />} />
          <Route path="/reset-password/" element={<ResetPassword />} />
          <Route path="/reset-password-failed/" element={<ResetPasswordFailed />} />

          {/* PROTECTED ROUTES */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/messages/" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/settings/" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/bookmarks/" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div style={{ textAlign: "center", marginTop: "80px", color: '#fff' }}>
                <h2>404 - Page Not Found</h2>
                <p>The page you are looking for does not exist.</p>
              </div>
            }
          />

        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;