// components/messaging/ConversationList.jsx
import React, { useEffect } from "react";
import { authManager } from "../helpers/authManager";

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const Avatar = ({ name = "", size = 40 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444"];
  const color  = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff",
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {initials}
    </div>
  );
};

export default function ConversationList({
  conversations = [],
  activeConversation,
  onlineUsers = new Set(),
  loadingConversations,
  onSelect,
  onNewConversation,
}) {
  const currentUser = authManager.getUser();

  const getOtherParticipant = (conv) => {
    if (conv.is_group) return null;
    return conv.participants?.find(p => p.id !== currentUser?.id);
  };

  const getDisplayName = (conv) => {
    if (conv.is_group) return conv.name || "Group";
    const other = getOtherParticipant(conv);
    return other?.full_name || "Unknown";
  };

  return (
    <div style={{
      width: 300, height: "100%", display: "flex", flexDirection: "column",
      background: "#0f0f13", borderRight: "1px solid #1e1e2e",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 12px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #1e1e2e",
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#f1f1f1", letterSpacing: "-0.3px" }}>
          Messages
        </span>
        <button onClick={onNewConversation} style={{
          background: "#3b82f6", border: "none", borderRadius: 8,
          width: 32, height: 32, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", color: "#fff",
          fontSize: 20, lineHeight: 1,
        }}>+</button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loadingConversations && (
          <div style={{ padding: 24, textAlign: "center", color: "#555" }}>Loading…</div>
        )}
        {!loadingConversations && conversations.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#555", fontSize: 14 }}>
            No conversations yet
          </div>
        )}
        {conversations.map(conv => {
          const other    = getOtherParticipant(conv);
          const name     = getDisplayName(conv);
          const isActive = activeConversation?.id === conv.id;
          const isOnline = other && onlineUsers.has(other.id);
          const last     = conv.last_message;

          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", cursor: "pointer",
                background: isActive ? "#1a1a2e" : "transparent",
                borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#141420"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {/* Avatar with online dot */}
              <div style={{ position: "relative" }}>
                <Avatar name={name} size={42} />
                {isOnline && (
                  <div style={{
                    position: "absolute", bottom: 1, right: 1,
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#10b981", border: "2px solid #0f0f13",
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 14, fontWeight: 600, color: "#f1f1f1",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{name}</span>
                  <span style={{ fontSize: 11, color: "#555", flexShrink: 0, marginLeft: 8 }}>
                    {timeAgo(last?.created_at || conv.updated_at)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                  <span style={{
                    fontSize: 13, color: "#666",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: 160,
                  }}>
                    {last
                      ? (last.message_type !== "text" ? "📎 Media" : last.content || "Deleted message")
                      : "Start a conversation"}
                  </span>
                  {conv.unread_count > 0 && (
                    <div style={{
                      background: "#3b82f6", color: "#fff", borderRadius: 10,
                      fontSize: 11, fontWeight: 700, minWidth: 18, height: 18,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 5px", flexShrink: 0,
                    }}>{conv.unread_count}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}