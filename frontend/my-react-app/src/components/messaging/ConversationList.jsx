// src/components/messaging/ConversationList.jsx
import React from "react";
import { Spinner } from "react-bootstrap";

// =============================================================================
// TRUTH LAYER 2: Render list based on conversations truth
// loading = True  → spinner
// conversations.length = 0 → empty state
// otherwise → list
// =============================================================================

function ConversationList({ conversations, activeId, loading, currentUser, onlineUsers, onSelect }) {

  const getOtherParticipant = (conv) => {
    if (conv.is_group) return null;
    return conv.participants?.find(p => p.id !== currentUser?.id);
  };

  const getDisplayName = (conv) => {
    if (conv.is_group) return conv.name || "Group";
    const other = getOtherParticipant(conv);
    return other?.full_name || "Unknown";
  };

  const getAvatar = (conv) => {
    if (conv.is_group) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name || "G")}&background=7c3aed&color=fff&bold=true`;
    }
    const other = getOtherParticipant(conv);
    if (other?.avatar_url?.startsWith("http")) return other.avatar_url;
    const name = other?.full_name || "U";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&bold=true`;
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return "now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getLastMessagePreview = (conv) => {
    if (!conv.last_message) return "No messages yet";
    if (conv.last_message.message_type !== "text") return `📎 ${conv.last_message.message_type}`;
    return conv.last_message.content || "Deleted message";
  };

  // TRUTH GATE: loading = True → spinner
  if (loading) {
    return (
      <div className="conv-list-loading">
        <Spinner animation="border" size="sm" variant="primary" />
      </div>
    );
  }

  // TRUTH GATE: no conversations → empty state
  if (conversations.length === 0) {
    return (
      <div className="conv-list-empty">
        <p className="text-muted small">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="conv-list">
      {conversations.map(conv => {
        const other = getOtherParticipant(conv);
        const isOnline = other && onlineUsers.has(other.id);
        const isActive = conv.id === activeId;   // True if selected
        const hasUnread = conv.unread_count > 0; // True if unread

        return (
          <div
            key={conv.id}
            className={`conv-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(conv)}
          >
            <div className="conv-avatar-wrap">
              <img
                src={getAvatar(conv)}
                alt={getDisplayName(conv)}
                className="conv-avatar"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=U&background=7c3aed&color=fff`;
                }}
              />
              {/* TRUTH GATE: isOnline = True → green dot */}
              {isOnline && <span className="online-dot" />}
            </div>

            <div className="conv-info">
              <div className="conv-name-row">
                <span className={`conv-name ${hasUnread ? "fw-bold" : ""}`}>
                  {getDisplayName(conv)}
                </span>
                <span className="conv-time">{getTimeAgo(conv.updated_at)}</span>
              </div>
              <div className="conv-preview-row">
                <span className={`conv-preview ${hasUnread ? "fw-semibold text-dark" : "text-muted"}`}>
                  {getLastMessagePreview(conv)}
                </span>
                {/* TRUTH GATE: hasUnread = True → badge */}
                {hasUnread && (
                  <span className="unread-badge">{conv.unread_count}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ConversationList;