// src/pages/AccountSettings.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Image } from "react-bootstrap";
import { useAuth } from "../components/contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import useUserActions from '../hooks/user.actions';
import Layout from '../components/Layout';
import EditProfileModal from '../components/modals/EditProfileModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import ChangeEmailModal from '../components/modals/ChangeEmailModal';
import DeleteAccountModal from '../components/modals/DeleteAccountModal';
import '../components/css/AccountSettings.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;

function AccountSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getAccountSettings, logout } = useUserActions();
  
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Error handler helper
  const handleApiError = (error, defaultMessage) => {
    if (error.response) {
      return error.response.data?.detail || defaultMessage;
    } else if (error.request) {
      return 'Network error. Please check your connection.';
    }
    return defaultMessage;
  };

  // Load account settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const settingsData = await getAccountSettings();
      setSettings(settingsData);
    } catch (err) {
      console.error('Failed to load settings:', err);
      const errorMessage = handleApiError(err, 'Failed to load account settings');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = () => {
    loadSettings(); // Refresh settings
    setShowEditProfile(false);
  };

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    alert('Password changed successfully! Please login again.');
    logout();
  };

  const handleEmailChanged = () => {
    loadSettings(); // Refresh to show unverified status
    setShowChangeEmail(false);
  };

  // Helper to get user's first and last name from settings
  const getFirstName = () => {
    if (settings?.first_name) return settings.first_name;
    return settings?.full_name?.split(' ')[0] || 'User';
  };

  const getLastName = () => {
    if (settings?.last_name) return settings.last_name;
    const nameParts = settings?.full_name?.split(' ') || [];
    return nameParts.slice(1).join(' ') || '';
  };

  // Get avatar URL with proper backend URL
  const getAvatarUrl = () => {
    // 1. If uploaded avatar exists, use it
    if (settings?.avatar) {
      if (settings.avatar.startsWith('http')) {
        return settings.avatar;
      }
      return `${BACKEND_URL}${settings.avatar}`;
    }
    
    // 2. If cached avatar_url exists (from backend), use it
    if (settings?.avatar_url) {
      if (settings.avatar_url.startsWith('http')) {
        return settings.avatar_url;
      }
      return `${BACKEND_URL}${settings.avatar_url}`;
    }
    
    // 3. Fallback to ui-avatars.com
    const firstName = getFirstName();
    const lastName = getLastName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=8b5cf6&color=fff&bold=true`;
  };

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  // Error State
  if (error || !settings) {
    return (
      <Layout>
        <div className="text-center py-5">
          <p className="text-danger mb-3">{error || 'Failed to load settings'}</p>
          <Button variant="primary" onClick={loadSettings}>
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="account-settings">
        {/* Header */}
        <div className="settings-header mb-4">
          <h1 className="display-5 mb-2">
            <i className="bi bi-gear me-2"></i>
            Account Settings
          </h1>
          <p className="text-white">Manage your account preferences and security</p>
        </div>

        {/* Profile Section */}
        <Card className="settings-card mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-person-circle me-2"></i>
                Profile Information
              </h5>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => setShowEditProfile(true)}
              >
                <i className="bi bi-pencil me-2"></i>
                Edit
              </Button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="user-avatar-wrapper">
                <Image
                  src={getAvatarUrl()}
                  roundedCircle
                  width={80}
                  height={80}
                  alt="User avatar"
                  className="user-avatar"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getFirstName())}+${encodeURIComponent(getLastName())}&background=8b5cf6&color=fff&bold=true`;
                  }}
                />
                <span className="online-indicator" />
              </div>
              <div>
                <h5 className="mb-1">{settings.full_name || 'User'}</h5>
                <p className="text-white mb-1">{settings.email}</p>
                {!settings.email_verified && (
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Email Not Verified
                  </span>
                )}
                {settings.email_verified && (
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Email Verified
                  </span>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Email & Password Section */}
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="card-title mb-4">
              <i className="bi bi-shield-lock me-2"></i>
              Security
            </h5>

            {/* Email */}
            <div className="mb-4 pb-3 border-bottom">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <label className="fw-semibold mb-1">Email Address</label>
                  <p className="mb-1">{settings.email}</p>
                  {!settings.email_verified && (
                    <small className="text-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Please verify your email
                    </small>
                  )}
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowChangeEmail(true)}
                >
                  Change
                </Button>
              </div>
            </div>

            {/* Password */}
            {settings.has_password && (
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <label className="fw-semibold mb-1">Password</label>
                  <p className="mb-0">••••••••</p>
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowChangePassword(true)}
                >
                  Change
                </Button>
              </div>
            )}

            {!settings.has_password && (
              <div className="alert alert-info mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Social Login Only</strong>
                <p className="mb-0 small mt-1">
                  You're using social authentication. Set a password to enable email login.
                </p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Connected Accounts Section */}
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="card-title mb-3">
              <i className="bi bi-link-45deg me-2"></i>
              Connected Accounts
            </h5>
            <p className="text-white mb-0">
              Connected accounts information will be available soon.
            </p>
          </Card.Body>
        </Card>

        {/* Danger Zone */}
        <Card className="settings-card border-danger">
          <Card.Body>
            <h5 className="card-title text-danger mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Danger Zone
            </h5>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <label className="fw-semibold mb-1">Delete Account</label>
                <p className="text-muted small mb-0">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="danger"
                onClick={() => setShowDeleteAccount(true)}
              >
                <i className="bi bi-trash me-2"></i>
                Delete
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Modals */}
        <EditProfileModal 
          show={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={handleProfileUpdated}
        />
        
        <ChangePasswordModal 
          show={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onSuccess={handlePasswordChanged}
        />
        
        <ChangeEmailModal 
          show={showChangeEmail}
          onClose={() => setShowChangeEmail(false)}
          onSuccess={handleEmailChanged}
          currentEmail={settings?.email}
        />
        
        <DeleteAccountModal 
          show={showDeleteAccount}
          onClose={() => setShowDeleteAccount(false)}
        />
      </div>
    </Layout>
  );
}

export default AccountSettings;