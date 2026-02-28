// src/components/Sidebar.jsx
// Replaces Navbar entirely — TikTok/IG/X-style sidebar + mobile bottom bar
import React, { memo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import useUserActions from "../hooks/user.actions";
import "./css/Sidebar.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { logout, getAccountSettings } = useUserActions();

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [collapsed, setCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Fetch avatar
  useEffect(() => {
    if (isAuthenticated && user) fetchAvatar();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const handleAvatarUpdate = () => {
      fetchAvatar();
      setAvatarKey(Date.now());
    };
    window.addEventListener("avatarUpdated", handleAvatarUpdate);
    return () => window.removeEventListener("avatarUpdated", handleAvatarUpdate);
  }, [isAuthenticated, user]);

  const fetchAvatar = async () => {
    try {
      const settings = await getAccountSettings();
      if (settings?.avatar) {
        const url = settings.avatar.startsWith("http")
          ? settings.avatar
          : `${BACKEND_URL}${settings.avatar}`;
        setAvatarUrl(url);
      } else if (settings?.avatar_url) {
        const url = settings.avatar_url.startsWith("http")
          ? settings.avatar_url
          : `${BACKEND_URL}${settings.avatar_url}`;
        setAvatarUrl(url);
      } else {
        setAvatarUrl(getFallbackAvatar(settings));
      }
    } catch {
      setAvatarUrl(getFallbackAvatar());
    }
  };

  const getFallbackAvatar = (settings = null) => {
    const firstName = settings?.first_name || user?.first_name || "U";
    const lastName = settings?.last_name || user?.last_name || "";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=7c3aed&color=fff&bold=true`;
  };

  const navItems = [
    { to: "/", icon: "house-door-fill", label: "Home" },
    { to: "/explore", icon: "compass-fill", label: "Explore" },
    { to: "/messages", icon: "chat-dots-fill", label: "Messages" },
    { to: "/notifications", icon: "bell-fill", label: "Notifications" },
    { to: "/bookmarks", icon: "bookmark-fill", label: "Bookmarks" },
    { to: `/profile/${user?.id}/`, icon: "person-fill", label: "Profile" },
    { to: "/settings", icon: "gear-fill", label: "Settings" },
  ];

  // Bottom bar items (mobile) — most important 5
  const mobileItems = [
    { to: "/", icon: "house-door-fill", label: "Home" },
    { to: "/explore", icon: "compass-fill", label: "Explore" },
    { to: "/create", icon: null, label: "Create", isCreate: true },
    { to: "/messages", icon: "chat-dots-fill", label: "Messages" },
    { to: `/profile/${user?.id}/`, icon: "person-fill", label: "Profile" },
  ];

  if (!isAuthenticated) return null;

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ───────────────────────────────────── */}
      <aside className={`pc-sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Brand */}
        <div className="pc-brand">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">⚡</span>
            {!collapsed && <span className="brand-name">PingChart</span>}
          </Link>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <i className={`bi bi-chevron-${collapsed ? "right" : "left"}`} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="pc-nav">
          {navItems.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`pc-nav-item ${isActive(to) ? "active" : ""}`}
              title={collapsed ? label : undefined}
            >
              <span className="pc-nav-icon">
                <i className={`bi bi-${icon}`} />
                {isActive(to) && <span className="active-pip" />}
              </span>
              {!collapsed && <span className="pc-nav-label">{label}</span>}
            </Link>
          ))}

          {/* Create / Post button */}
          <button
            className="pc-create-btn"
            onClick={() => navigate("/create")}
          >
            <span className="pc-nav-icon">
              <i className="bi bi-plus-lg" />
            </span>
            {!collapsed && <span className="pc-nav-label">Create</span>}
          </button>
        </nav>

        {/* User profile footer */}
        <div className="pc-user-footer">
          <button
            className="pc-user-btn"
            onClick={() => setProfileMenuOpen((o) => !o)}
          >
            <div className="pc-avatar-wrap">
              <img
                key={avatarKey}
                src={avatarUrl || getFallbackAvatar()}
                alt="avatar"
                className="pc-avatar"
                onError={(e) => (e.target.src = getFallbackAvatar())}
              />
              <span className="pc-online-dot" />
            </div>
            {!collapsed && (
              <div className="pc-user-info">
                <span className="pc-user-name">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="pc-user-handle">@{user?.username || user?.email?.split("@")[0]}</span>
              </div>
            )}
            {!collapsed && (
              <i className="bi bi-three-dots-vertical pc-user-more" />
            )}
          </button>

          {/* Profile popup menu */}
          {profileMenuOpen && (
            <div className="pc-profile-menu">
              <Link
                to="/settings"
                className="pc-profile-menu-item"
                onClick={() => setProfileMenuOpen(false)}
              >
                <i className="bi bi-gear" /> add another extiting
              </Link>
              <div className="pc-profile-menu-divider" />
              <button
                className="pc-profile-menu-item danger"
                onClick={() => { setProfileMenuOpen(false); logout(); }}
              >
                <i className="bi bi-box-arrow-right" /> Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MOBILE BOTTOM BAR ─────────────────────────────────── */}
      <nav className="pc-bottom-bar">
        {mobileItems.map(({ to, icon, label, isCreate }) =>
          isCreate ? (
            <button
              key="create"
              className="pc-bottom-create"
              onClick={() => navigate("/create")}
            >
              <i className="bi bi-plus-lg" />
            </button>
          ) : (
            <Link
              key={to}
              to={to}
              className={`pc-bottom-item ${isActive(to) ? "active" : ""}`}
            >
              {label === "Profile" ? (
                <img
                  src={avatarUrl || getFallbackAvatar()}
                  alt="avatar"
                  className={`pc-bottom-avatar ${isActive(to) ? "active" : ""}`}
                />
              ) : (
                <i className={`bi bi-${icon}`} />
              )}
              <span>{label}</span>
            </Link>
          )
        )}
      </nav>

      {/* Overlay to close profile menu */}
      {profileMenuOpen && (
        <div
          className="pc-overlay"
          onClick={() => setProfileMenuOpen(false)}
        />
      )}
    </>
  );
}

export default memo(Sidebar);