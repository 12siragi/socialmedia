import "./modals.css"; 
// src/components/modals/ChangeEmailModal.jsx
import React, { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import useUserActions from "../../hooks/user.actions";

function ChangeEmailModal({ show, onClose, onSuccess, currentEmail }) {
  const { changeEmail } = useUserActions();

  const [formData, setFormData] = useState({
    newEmail: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.newEmail)) {
      setMessage({ type: "danger", text: "❌ Please enter a valid email address" });
      setLoading(false);
      return;
    }

    try {
      await changeEmail(formData.newEmail, formData.password);
      setMessage({ type: "success", text: "✅ Email changed! Please verify your new email." });
      setTimeout(() => {
        setFormData({ newEmail: "", password: "" });
        setMessage(null);
        onSuccess(); // Refresh settings in parent
      }, 2000);
    } catch (error) {
      console.error("Email change error:", error);
      setMessage({
        type: "danger",
        text: error.response?.data?.message || error.response?.data?.detail || "❌ Failed to change email.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="modal-header-dark">
        <Modal.Title>
          <i className="bi bi-envelope me-2"></i>
          Change Email
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="modal-body-dark">
        <div className="mb-3">
          <small className="text-white">
            Current Email: <strong>{currentEmail}</strong>
          </small>
        </div>

        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>New Email</Form.Label>
            <Form.Control
              type="email"
              value={formData.newEmail}
              onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
              required
              placeholder="newemail@example.com"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
            />
            <Form.Text className="text-muted">Enter your password to confirm</Form.Text>
          </Form.Group>

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Changing...
                </>
              ) : (
                <>
                  <i className="bi bi-envelope-check me-2"></i>
                  Change Email
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default ChangeEmailModal;