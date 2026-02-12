// components/modals/DeleteAccountModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import useUserActions from '../../hooks/user.actions';

function DeleteAccountModal({ show, onClose }) {
  const { deleteAccount } = useUserActions();
  
  const [step, setStep] = useState(1); // 1 = warning, 2 = confirmation
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleContinue = () => {
    setStep(2);
    setError(null);
  };

  const handleBack = () => {
    setStep(1);
    setPassword('');
    setConfirmText('');
    setError(null);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password) {
      setError('Password is required');
      return;
    }

    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);

    try {
      await deleteAccount(password);
      // User will be redirected to login by the action
    } catch (err) {
      console.error('Delete account error:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to delete account';
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setPassword('');
      setConfirmText('');
      setError(null);
      setShowPassword(false);
      onClose();
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      className="profile-modal delete-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          {step === 1 ? 'Delete Account?' : 'Confirm Account Deletion'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {step === 1 ? (
          // Step 1: Warning
          <div className="delete-warning">
            <div className="warning-icon">⚠️</div>
            
            <h5 className="text-center mb-3">This action cannot be undone</h5>
            
            <Alert variant="danger">
              <strong>You are about to permanently delete your account.</strong>
              <p className="mb-0 mt-2">This will immediately:</p>
              <ul className="mb-0 mt-2">
                <li>Delete all your personal information</li>
                <li>Remove your profile and posts</li>
                <li>Disconnect all social accounts</li>
                <li>Cancel any active subscriptions</li>
              </ul>
            </Alert>

            <p className=" text-white text-center mb-0">
              All your data will be permanently removed from our servers within 30 days.
            </p>
          </div>
        ) : (
          // Step 2: Confirmation
          <Form onSubmit={handleDelete}>
            <Alert variant="warning">
              Please confirm this action by entering your password and typing <strong>DELETE</strong>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Type <span className="text-danger fw-bold">DELETE</span> to confirm
              </Form.Label>
              <Form.Control
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                required
              />
              <Form.Text className="text-muted">
                This must match exactly (case-sensitive)
              </Form.Text>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        {step === 1 ? (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleContinue}>
              Continue
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={handleBack} disabled={loading}>
              Back
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Deleting...
                </>
              ) : (
                'Delete My Account'
              )}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default DeleteAccountModal;