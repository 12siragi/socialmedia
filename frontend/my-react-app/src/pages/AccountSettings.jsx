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
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleApiError = (error, defaultMessage) => {
    if (error.response) return error.response.data?.detail || defaultMessage;
    if (error.request) return 'Network error. Please check your connection.';
    return defaultMessage;
  };

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settingsData = await getAccountSettings();
      setSettings(settingsData);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load account settings'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = () => { loadSettings(); setShowEditProfile(false); };
  const handlePasswordChanged = () => { setShowChangePassword(false); alert('Password changed successfully! Please login again.'); logout(); };
  const handleEmailChanged = () => { loadSettings(); setShowChangeEmail(false); };

  const getFirstName = () => settings?.first_name || settings?.full_name?.split(' ')[0] || 'User';
  const getLastName = () => {
    if (settings?.last_name) return settings.last_name;
    const parts = settings?.full_name?.split(' ') || [];
    return parts.slice(1).join(' ') || '';
  };

  const getAvatarUrl = () => {
    const rawUrl = settings?.avatar_url || settings?.avatar || "";

    if (!rawUrl) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(getFirstName())}+${encodeURIComponent(getLastName())}&background=8b5cf6&color=fff&bold=true`;
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

  if (error || !settings) {
    return (
      <Layout>
        <div className="text-center py-5">
          <p className="text-danger mb-3">{error || 'Failed to load settings'}</p>
          <Button variant="primary" onClick={loadSettings}>Retry</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="account-settings">
        <div className="settings-header mb-4">
          <h1 className="display-5 mb-2">
            <i className="bi bi-gear me-2"></i>Account Settings
          </h1>
          <p className="text-white">Manage your account preferences and security</p>
        </div>

        {/* Profile Section */}
        <Card className="settings-card mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-person-circle me-2"></i>Profile Information
              </h5>
              <Button variant="outline-primary" size="sm" onClick={() => setShowEditProfile(true)}>
                <i className="bi bi-pencil me-2"></i>Edit
              </Button>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="user-avatar-wrapper">
                <Image
                  src={getAvatarUrl()}
                  roundedCircle width={80} height={80}
                  alt="User avatar" className="user-avatar"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getFirstName())}+${encodeURIComponent(getLastName())}&background=8b5cf6&color=fff&bold=true`;
                  }}
                />
                <span className="online-indicator" />
              </div>
              <div>
                <h5 className="mb-1">{settings.full_name || 'User'}</h5>
                <p className="text-white mb-1">{settings.email}</p>
                {!settings.email_verified ? (
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-exclamation-triangle me-1"></i>Email Not Verified
                  </span>
                ) : (
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>Email Verified
                  </span>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Security Section */}
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="card-title mb-4">
              <i className="bi bi-shield-lock me-2"></i>Security
            </h5>
            <div className="mb-4 pb-3 border-bottom">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <label className="fw-semibold mb-1">Email Address</label>
                  <p className="mb-1">{settings.email}</p>
                  {!settings.email_verified && (
                    <small className="text-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>Please verify your email
                    </small>
                  )}
                </div>
                <Button variant="outline-primary" size="sm" onClick={() => setShowChangeEmail(true)}>
                  Change
                </Button>
              </div>
            </div>
            {settings.has_password ? (
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <label className="fw-semibold mb-1">Password</label>
                  <p className="mb-0">••••••••</p>
                </div>
                <Button variant="outline-primary" size="sm" onClick={() => setShowChangePassword(true)}>
                  Change
                </Button>
              </div>
            ) : (
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

        {/* Connected Accounts */}
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="card-title mb-3">
              <i className="bi bi-link-45deg me-2"></i>Connected Accounts
            </h5>
            <p className="text-white mb-0">Connected accounts information will be available soon.</p>
          </Card.Body>
        </Card>

        {/* Danger Zone */}
        <Card className="settings-card border-danger">
          <Card.Body>
            <h5 className="card-title text-danger mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>Danger Zone
            </h5>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <label className="fw-semibold mb-1">Delete Account</label>
                <p className="text-muted small mb-0">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button variant="danger" onClick={() => setShowDeleteAccount(true)}>
                <i className="bi bi-trash me-2"></i>Delete
              </Button>
            </div>
          </Card.Body>
        </Card>

        <EditProfileModal show={showEditProfile} onClose={() => setShowEditProfile(false)} onSuccess={handleProfileUpdated} />
        <ChangePasswordModal show={showChangePassword} onClose={() => setShowChangePassword(false)} onSuccess={handlePasswordChanged} />
        <ChangeEmailModal show={showChangeEmail} onClose={() => setShowChangeEmail(false)} onSuccess={handleEmailChanged} currentEmail={settings?.email} />
        <DeleteAccountModal show={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} />
      </div>
    </Layout>
  );
}

export default AccountSettings;