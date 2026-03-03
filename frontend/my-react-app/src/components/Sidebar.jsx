// src/components/Sidebar.jsx
import React, { memo, useState, useEffect, useCallback } from "react";
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

  const getFallbackAvatar = useCallback((settings = null) => {
    const firstName = settings?.first_name || user?.first_name || "U";
    const lastName = settings?.last_name || user?.last_name || "";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=7c3aed&color=fff&bold=true`;
  }, [user]);

  const fetchAvatar = useCallback(async () => {
    try {
      const settings = await getAccountSettings();
      const rawUrl = settings?.avatar_url || settings?.avatar || "";
      console.log('rawUrl:', rawUrl);

      if (!rawUrl) {
        setAvatarUrl(getFallbackAvatar(settings));
        return;
      }

      // Full URL (Cloudinary, ui-avatars, google) — use as-is
      if (rawUrl.startsWith("http")) {
        setAvatarUrl(rawUrl);
        return;
      }

      // Has /media/ path — prepend BACKEND_URL
      if (rawUrl.includes("/media/")) {
        const path = rawUrl.substring(rawUrl.indexOf("/media/"));
        setAvatarUrl(`${BACKEND_URL}${path}`);
        return;
      }

      // Cloudinary relative path without /media/ — prepend BACKEND_URL
      setAvatarUrl(`${BACKEND_URL}${rawUrl}`);

    } catch (err) {
      console.error("Avatar fetch failed:", err);
      setAvatarUrl(getFallbackAvatar());
    }
  }, [getAccountSettings, getFallbackAvatar]);

  useEffect(() => {
    if (isAuthenticated && user) fetchAvatar();
  }, [isAuthenticated, user?.id, fetchAvatar]);

  useEffect(() => {
    const handleAvatarUpdate = () => {
      fetchAvatar();
      setAvatarKey(Date.now());
    };
    window.addEventListener("avatarUpdated", handleAvatarUpdate);
    return () => window.removeEventListener("avatarUpdated", handleAvatarUpdate);
  }, [fetchAvatar]);

  const navItems = [
    { to: "/", icon: "house-door-fill", label: "Home" },
    { to: "/explore", icon: "compass-fill", label: "Explore" },
    { to: "/messages", icon: "chat-dots-fill", label: "Messages" },
    { to: "/notifications", icon: "bell-fill", label: "Notifications" },
    { to: "/bookmarks", icon: "bookmark-fill", label: "Bookmarks" },
    { to: `/profile/${user?.id}/`, icon: "person-fill", label: "Profile" },
    { to: "/settings", icon: "gear-fill", label: "Settings" },
  ];

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
      {/* DESKTOP SIDEBAR */}
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

          {/* Create button */}
          <button className="pc-create-btn" onClick={() => navigate("/create")}>
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
                <span className="pc-user-handle">
                  @{user?.username || user?.email?.split("@")[0]}
                </span>
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
                to={`/profile/${user?.id}/`}
                className="pc-profile-menu-item"
                onClick={() => setProfileMenuOpen(false)}
              >
                <i className="bi bi-person" /> View Profile
              </Link>
              <Link
                to="/settings"
                className="pc-profile-menu-item"
                onClick={() => setProfileMenuOpen(false)}
              >
                <i className="bi bi-gear" /> Settings
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

      {/* MOBILE BOTTOM BAR */}
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
                  onError={(e) => (e.target.src = getFallbackAvatar())}
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
        <div className="pc-overlay" onClick={() => setProfileMenuOpen(false)} />
      )}
    </>
  );
}

export default memo(Sidebar);