// components/modals/EditProfileModal.jsx
import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

function EditProfileModal({ show, onClose, onSuccess }) {
  const { getUser, updateProfile } = useUserActions();
  const user = getUser();
  
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar file size cannot exceed 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };
      
      if (avatar) {
        data.avatar = avatar;
      }

      await updateProfile(data);
      
      onSuccess?.();
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setAvatarPreview(null);
      setAvatar(null);
      setFirstName(user?.first_name || '');
      setLastName(user?.last_name || '');
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="profile-modal">
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div className="avatar-upload-section">
            <div className="avatar-preview">
              <img 
                src={avatarPreview || user?.avatar} 
                alt="Profile"
                className="avatar-preview-img"
              />
            </div>
            <div className="avatar-upload-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </Button>
              {avatarPreview && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    setAvatar(null);
                    setAvatarPreview(null);
                  }}
                >
                  Remove
                </Button>
              )}
              <small className="text-muted d-block mt-2">
                Max 5MB • JPEG, PNG, WebP
              </small>
            </div>
          </div>

          {/* Name Fields */}
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              required
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default EditProfileModal;