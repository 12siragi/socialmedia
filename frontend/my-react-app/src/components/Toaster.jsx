import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";

function Toaster({ showToast, title, message, onClose, type = "success" }) {
  // Don't render anything if showToast is false
  if (!showToast) return null;

  return (
    <ToastContainer 
      position="top-center" 
      className="position-fixed"
      style={{ zIndex: 9999 }}
    >
      <Toast 
        onClose={onClose} 
        show={showToast} 
        delay={4000}
        autohide 
        bg={type}
        className="text-white"
      >
        <Toast.Header closeButton>
          <strong className="me-auto">{title}</strong>
        </Toast.Header>
        <Toast.Body>
          <p className="mb-0 text-white">{message}</p>
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export default Toaster;