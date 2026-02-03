import React from "react";

function CheckEmail() {
  const authTemp = JSON.parse(localStorage.getItem("auth_temp"));

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>📧 Check your email</h2>
      <p>{authTemp?.message || "Please check your inbox to verify your email."}</p>
      <p>Email: {authTemp?.email}</p>
    </div>
  );
}

export default CheckEmail;
