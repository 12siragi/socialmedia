// pages/AccountSettings.jsx - FIXED VERSION (Media URL)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import useUserActions from '../hooks/user.actions';
import Layout from '../components/Layout';
import EditProfileModal from '../components/modals/EditProfileModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import ChangeEmailModal from '../components/modals/ChangeEmailModal';
import DeleteAccountModal from '../components/modals/DeleteAccountModal';
import '../components/css/AccountSettings.css';


function AccountSettings() {
  const navigate = useNavigate();
  const { getAccountSettings, getConnectedAccountsDetailed, logout } = useUserActions();
  
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // ✅ Error handler helper
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
      
      const [settingsData, accountsData] = await Promise.all([
        getAccountSettings(),
        getConnectedAccountsDetailed(),
      ]);
      
      setSettings(settingsData);
      setConnectedAccounts(accountsData.social_accounts || []);
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

  // ✅ FIXED: Get avatar URL with proper backend URL
  const getAvatarUrl = () => {
    // 1. If uploaded avatar exists, use it
    if (settings?.avatar) {
      // Check if it's already a full URL
      if (settings.avatar.startsWith('http')) {
        return settings.avatar;
      }
      // ✅ Prepend BACKEND_URL for relative paths
      return `${BACKEND_URL}${settings.avatar}`;
    }
    
    // 2. If cached avatar_url exists (from backend), use it
    if (settings?.avatar_url) {
      // Check if it's already a full URL
      if (settings.avatar_url.startsWith('http')) {
        return settings.avatar_url;
      }
      // ✅ Prepend BACKEND_URL for relative paths
      return `${BACKEND_URL}${settings.avatar_url}`;
    }
    
    // 3. Fallback to ui-avatars.com
    const firstName = getFirstName();
    const lastName = getLastName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=8b5cf6&color=fff&bold=true`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="account-settings-loading">
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
        <div className="account-settings-error">
          <p>{error || 'Failed to load settings'}</p>
          <button className="btn btn-primary" onClick={loadSettings}>
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="account-settings-container">
        <div className="account-settings-wrapper">
          <div className="account-settings-header">
            <h1 className="account-settings-title">Account Settings</h1>
          </div>

          <div className="account-settings-content">
            {/* Profile Section */}
            <div className="account-settings-section">
              <div className="account-settings-section-header">
                <h2 className="account-settings-section-title">Profile</h2>
                <button 
                  className="account-settings-btn-edit"
                  onClick={() => setShowEditProfile(true)}
                >
                  Edit Profile
                </button>
              </div>
              <div className="account-settings-section-body">
                <div className="account-settings-profile-display">
                  <div className="user-avatar-wrapper">
                    <Image
                      src={getAvatarUrl()}
                      roundedCircle
                      width={80}
                      height={80}
                      alt="User avatar"
                      className="user-avatar"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getFirstName())}+${encodeURIComponent(getLastName())}&background=8b5cf6&color=fff&bold=true`;
                      }}
                    />
                    <span className="online-indicator" />
                  </div>
                  <div className="account-settings-profile-info">
                    <h3>{settings.full_name}</h3>
                    <p>{settings.email}</p>
                    {!settings.email_verified && (
                      <span className="account-settings-badge-warning">
                        Email Not Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Email & Password Section */}
            <div className="account-settings-section">
              <div className="account-settings-section-header">
                <h2 className="account-settings-section-title">Email & Password</h2>
              </div>
              <div className="account-settings-section-body">
                <div className="account-settings-item">
                  <div className="account-settings-item-info">
                    <label className="account-settings-item-label">Email Address</label>
                    <p className="account-settings-item-value">{settings.email}</p>
                    {!settings.email_verified && (
                      <span style={{ color: '#ffc107', fontSize: '0.875rem' }}>
                        ⚠️ Please verify your email
                      </span>
                    )}
                  </div>
                  <button 
                    className="account-settings-btn-change"
                    onClick={() => setShowChangeEmail(true)}
                  >
                    Change Email
                  </button>
                </div>

                {settings.has_password && (
                  <div className="account-settings-item">
                    <div className="account-settings-item-info">
                      <label className="account-settings-item-label">Password</label>
                      <p className="account-settings-item-value">••••••••</p>
                    </div>
                    <button 
                      className="account-settings-btn-change"
                      onClick={() => setShowChangePassword(true)}
                    >
                      Change Password
                    </button>
                  </div>
                )}

                {!settings.has_password && (
                  <div className="alert alert-info">
                    <strong>Social Login Only</strong>
                    <p className="mb-0 small">
                      You're using social authentication. 
                      Set a password to enable email login.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Connected Accounts Section */}
            <div className="account-settings-section">
              <div className="account-settings-section-header">
                <h2 className="account-settings-section-title">Connected Accounts</h2>
              </div>
              <div className="account-settings-section-body">
                {connectedAccounts.length === 0 ? (
                  <p style={{ color: '#8e8e93' }}>No social accounts connected</p>
                ) : (
                  <div className="account-settings-connected-list">
                    {connectedAccounts.map((account, index) => (
                      <div 
                        key={`${account.provider}-${index}`} 
                        className="account-settings-connected-item"
                      >
                        <div className="account-settings-account-icon">
                          {account.provider === 'google-oauth2' && '🔵'}
                          {account.provider === 'github' && '⚫'}
                          {account.provider === 'facebook' && '🔵'}
                        </div>
                        <div className="account-settings-account-details">
                          <strong>
                            {account.provider === 'google-oauth2' ? 'Google' : 
                             account.provider === 'github' ? 'GitHub' : 
                             account.provider}
                          </strong>
                          <p className="text-muted small mb-0">
                            Connected on {new Date(account.created).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="account-settings-badge-success">Connected</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="account-settings-section account-settings-danger">
              <div className="account-settings-section-header">
                <h2 className="account-settings-section-title">Danger Zone</h2>
              </div>
              <div className="account-settings-section-body">
                <div className="account-settings-danger-item">
                  <div className="account-settings-item-info">
                    <label className="account-settings-item-label">Delete Account</label>
                    <p className="small" style={{ color: '#8e8e93' }}>
                      Permanently delete your account and all associated data. 
                      This action cannot be undone.
                    </p>
                  </div>
                  <button 
                    className="account-settings-btn-danger"
                    onClick={() => setShowDeleteAccount(true)}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

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
      </div>
    </Layout>
  );
}

export default AccountSettings;