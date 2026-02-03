import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axiosService from "../components/helpers/axios";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    if (!uid || !token) {
      setStatus("invalid");
      return;
    }

    axiosService
      .get(`/api/auth/verify-email/?uid=${uid}&token=${token}`)
      .then(() => {
        setStatus("success");
      })
      .catch(() => {
        setStatus("failed");
      });
  }, [searchParams]);

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      {status === "verifying" && <p>🔄 Verifying your email...</p>}

      {status === "success" && (
        <>
          <h2>✅ Email verified successfully!</h2>
          <p>You can now log in to your account.</p>
          <Link to="/login/">Go to Login</Link>
        </>
      )}

      {status === "failed" && (
        <>
          <h2>❌ Verification failed</h2>
          <p>The link may be expired or invalid.</p>
        </>
      )}

      {status === "invalid" && (
        <>
          <h2>⚠️ Invalid verification link</h2>
        </>
      )}
    </div>
  );
}

export default VerifyEmail;
