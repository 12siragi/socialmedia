// components/modals/EditProfileModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import useUserActions from '../../hooks/user.actions';
import '../css/ProfileModals.css';

function EditProfileModal({ show, onClose, onSuccess }) {
  const { getUser, updateProfile, getAccountSettings } = useUserActions();
  const user = getUser();
  
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  // Load current avatar on mount
  useEffect(() => {
    if (show) {
      // Reset form when modal opens
      setFirstName(user?.first_name || '');
      setLastName(user?.last_name || '');
      setAvatarPreview(null);
      setAvatar(null);
      
      // Try to get avatar_url from account settings
      getAccountSettings().then(settings => {
        setCurrentAvatarUrl(settings.avatar_url);
      }).catch(() => {
        // Fallback to user.avatar if available
        setCurrentAvatarUrl(user?.avatar);
      });
    }
  }, [show]);

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

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      
      // Clear preview after successful upload
      setAvatarPreview(null);
      setAvatar(null);
      
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

  // Get the display avatar URL
  const displayAvatarUrl = avatarPreview || currentAvatarUrl || user?.avatar;

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      className="profile-edit-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div className="profile-edit-avatar-section">
            <div className="profile-edit-avatar-preview">
              <img 
                src={displayAvatarUrl}
                alt="Profile"
                className="profile-edit-avatar-img"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=8b5cf6&color=fff&bold=true`;
                }}
              />
            </div>
            <div className="profile-edit-avatar-actions">
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
                disabled={loading}
              >
                Choose Image
              </Button>
              {avatarPreview && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
              <small className="text-white d-block mt-2">
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
              disabled={loading}
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
              disabled={loading}
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