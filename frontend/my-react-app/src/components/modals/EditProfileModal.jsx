// src/components/modals/EditProfileModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Alert, Image } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import useUserActions from "../../hooks/user.actions";
import "../modals/modals.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;

function EditProfileModal({ show, onClose, onSuccess }) {
  const { user } = useAuth();
  const { updateProfile, getAccountSettings } = useUserActions();

  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({ first_name: "", last_name: "", avatar: null });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (show) loadSettings();
  }, [show]);

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const settingsData = await getAccountSettings();
      setSettings(settingsData);
      setFormData({
        first_name: settingsData.first_name || "",
        last_name: settingsData.last_name || "",
        avatar: null,
      });
    } catch (error) {
      setMessage({ type: "danger", text: "Failed to load current settings" });
    } finally {
      setLoadingSettings(false);
    }
  };

  const getAvatarUrl = () => {
    const rawUrl = settings?.avatar_url || settings?.avatar || "";

    if (!rawUrl) {
      const firstName = settings?.first_name || user?.first_name || "U";
      const lastName = settings?.last_name || user?.last_name || "";
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=8b5cf6&color=fff&bold=true`;
    }

    // External URLs (ui-avatars, google) use as-is
    if (rawUrl.startsWith("http") && !rawUrl.includes("/media/")) {
      return rawUrl;
    }

    // Extract /media/ path and prepend current BACKEND_URL
    const mediaIndex = rawUrl.indexOf("/media/");
    if (mediaIndex !== -1) {
      return `${BACKEND_URL}${rawUrl.substring(mediaIndex)}`;
    }

    return rawUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        avatar: formData.avatar,
      };

      console.log('Submitting profile update:', submitData);
      await updateProfile(submitData);

      setMessage({ type: "success", text: "✅ Profile updated successfully!" });

      window.dispatchEvent(new CustomEvent('avatarUpdated', {
        detail: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          hasNewAvatar: !!formData.avatar
        }
      }));

      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1500);
    } catch (error) {
      const errorData = error.response?.data;
      let errorMessage = "❌ Failed to update profile.";

      if (errorData?.first_name) errorMessage = `❌ First Name: ${Array.isArray(errorData.first_name) ? errorData.first_name[0] : errorData.first_name}`;
      else if (errorData?.last_name) errorMessage = `❌ Last Name: ${Array.isArray(errorData.last_name) ? errorData.last_name[0] : errorData.last_name}`;
      else if (errorData?.avatar) errorMessage = `❌ Avatar: ${Array.isArray(errorData.avatar) ? errorData.avatar[0] : errorData.avatar}`;
      else if (errorData?.detail) errorMessage = `❌ ${errorData.detail}`;

      setMessage({ type: "danger", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "danger", text: "❌ File size must be less than 5MB" });
      e.target.value = null;
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "danger", text: "❌ Please upload a valid image (JPG, PNG, GIF, WEBP)" });
      e.target.value = null;
      return;
    }

    setFormData({ ...formData, avatar: file });
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setFormData({ first_name: "", last_name: "", avatar: null });
    setAvatarPreview(null);
    setMessage(null);
    setSettings(null);
    if (onClose) onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton className="modal-header-dark">
        <Modal.Title>
          <i className="bi bi-person-circle me-2"></i>Edit Profile
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="modal-body-dark">
        {loadingSettings ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {message && (
              <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            <div className="text-center mb-4">
              <div className="user-avatar-wrapper d-inline-block position-relative">
                <Image
                  src={avatarPreview || getAvatarUrl()}
                  roundedCircle width={100} height={100}
                  alt="Avatar preview" className="user-avatar"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff&bold=true`;
                  }}
                />
                <span className="online-indicator" />
              </div>
              <div className="mt-2">
                <small className="text-muted">
                  {avatarPreview ? "New avatar selected" : "Current avatar"}
                </small>
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Profile Picture</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                />
                <Form.Text className="text-muted">
                  Max file size: 5MB. Supported: JPG, PNG, GIF, WEBP
                </Form.Text>
              </Form.Group>

              <div className="d-flex gap-2 justify-content-end">
                <Button variant="secondary" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                  ) : (
                    <><i className="bi bi-check-circle me-2"></i>Save Changes</>
                  )}
                </Button>
              </div>
            </Form>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default EditProfileModal;