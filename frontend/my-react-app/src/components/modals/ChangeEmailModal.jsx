// components/modals/ChangeEmailModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import useUserActions from '../../hooks/user.actions';

function ChangeEmailModal({ show, onClose, onSuccess, currentEmail }) {
  const { changeEmail } = useUserActions();
  
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newEmail || !password) {
      setError('All fields are required');
      return;
    }

    if (newEmail === currentEmail) {
      setError('New email is the same as current email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await changeEmail(newEmail, password);
      onSuccess?.();
    } catch (err) {
      console.error('Change email error:', err);
      const errorMsg = err.response?.data?.new_email?.[0] || 
                       err.response?.data?.password?.[0] ||
                       err.response?.data?.detail || 
                       'Failed to change email';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNewEmail('');
      setPassword('');
      setError(null);
      setShowPassword(false);
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="profile-modal">
      <Modal.Header closeButton>
        <Modal.Title>Change Email</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Alert variant="warning">
          <strong>⚠️ Important:</strong>
          <ul className="mb-0 mt-2 small">
            <li>You'll need to verify your new email address</li>
            <li>You won't be able to log in until verification is complete</li>
            <li>A verification email will be sent to your new address</li>
          </ul>
        </Alert>
        
        <Form onSubmit={handleSubmit}>
          {/* Current Email (readonly) */}
          <Form.Group className="mb-3">
            <Form.Label>Current Email</Form.Label>
            <Form.Control
              type="email"
              value={currentEmail}
              disabled
              readOnly
            />
          </Form.Group>

          {/* New Email */}
          <Form.Group className="mb-3 text-white">
            <Form.Label>New Email</Form.Label>
            <Form.Control
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value.toLowerCase().trim())}
              placeholder="Enter new email address"
              required
            />
          </Form.Group>

          {/* Password Confirmation */}
          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <div className="password-input-wrapper">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <Form.Text className="text-white">
              Enter your current password to confirm this change
            </Form.Text>
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
              Updating...
            </>
          ) : (
            'Change Email'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ChangeEmailModal;