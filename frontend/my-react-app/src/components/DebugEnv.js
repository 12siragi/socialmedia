import React from "react";

const DebugEnv = () => {
  return (
    <div style={{
      position: "fixed",
      bottom: 10,
      right: 10,
      backgroundColor: "rgba(0,0,0,0.7)",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "5px",
      fontSize: "14px",
      zIndex: 9999
    }}>
      <strong>API Base URL:</strong> {process.env.REACT_APP_API_URL}
    </div>
  );
};

export default DebugEnv;
