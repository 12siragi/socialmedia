// components/messaging/MessageBubble.jsx
import React, { useState } from "react";
import { authManager } from "../helpers/authManager";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function MessageBubble({ message, onDelete, showTranslation = true }) {
  const currentUser = authManager.getUser();
  const isMine      = message.sender?.id === currentUser?.id;
  const [showOrig, setShowOrig]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  const translation   = message.translation;
  const hasTranslation = translation?.is_complete && translation?.translated_content;
  const displayContent = (showTranslation && hasTranslation && !showOrig)
    ? translation.translated_content
    : message.content;

  if (message.is_deleted) {
    return (
      <div style={{
        display: "flex", justifyContent: isMine ? "flex-end" : "flex-start",
        padding: "2px 16px",
      }}>
        <div style={{
          padding: "8px 14px", borderRadius: 16,
          background: "transparent", border: "1px solid #2a2a3e",
          color: "#555", fontSize: 13, fontStyle: "italic",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isMine ? "flex-end" : "flex-start",
      padding: "2px 16px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Sender name for group chats */}
      {!isMine && message.sender?.full_name && (
        <span style={{ fontSize: 11, color: "#555", marginBottom: 3, marginLeft: 4 }}>
          {message.sender.full_name}
        </span>
      )}

      {/* Reply preview */}
      {message.reply_to_preview && (
        <div style={{
          background: "#1a1a2e", borderLeft: "3px solid #3b82f6",
          borderRadius: "8px 8px 0 0", padding: "6px 12px",
          fontSize: 12, color: "#888", maxWidth: 320,
          marginBottom: -4,
        }}>
          <span style={{ fontWeight: 600, color: "#aaa" }}>
            {message.reply_to_preview.sender}
          </span>
          <div style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {message.reply_to_preview.content}
          </div>
        </div>
      )}

      {/* Bubble */}
      <div style={{ position: "relative", maxWidth: 340 }}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <div style={{
          padding: "9px 14px",
          borderRadius: message.reply_to_preview
            ? (isMine ? "4px 16px 4px 16px" : "16px 4px 16px 4px")
            : 16,
          background: isMine ? "#3b82f6" : "#1e1e2e",
          color: isMine ? "#fff" : "#e8e8f0",
          fontSize: 14, lineHeight: 1.5,
          wordBreak: "break-word",
          boxShadow: isMine
            ? "0 2px 12px rgba(59,130,246,0.25)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}>
          {/* Media */}
          {message.media_url && (
            <img
              src={message.media_url}
              alt="media"
              style={{
                maxWidth: "100%", borderRadius: 8,
                marginBottom: displayContent ? 6 : 0, display: "block",
              }}
            />
          )}

          {/* Content */}
          {displayContent && <span>{displayContent}</span>}

          {/* Translation badge */}
          {hasTranslation && showTranslation && (
            <button
              onClick={() => setShowOrig(v => !v)}
              style={{
                display: "block", marginTop: 4,
                background: "none", border: "none", padding: 0,
                fontSize: 11, color: isMine ? "rgba(255,255,255,0.6)" : "#555",
                cursor: "pointer", textDecoration: "underline",
              }}
            >
              {showOrig ? "Show translation" : "Show original"}
            </button>
          )}

          {/* Pending translation */}
          {!hasTranslation && message.translation === null && (
            <span style={{
              display: "block", marginTop: 4,
              fontSize: 11, color: isMine ? "rgba(255,255,255,0.4)" : "#444",
              fontStyle: "italic",
            }}>
              Translating…
            </span>
          )}
        </div>

        {/* Hover actions */}
        {menuOpen && isMine && (
          <button
            onClick={() => onDelete?.(message.id)}
            style={{
              position: "absolute", top: "50%", left: -36,
              transform: "translateY(-50%)",
              background: "#1e1e2e", border: "1px solid #2a2a3e",
              borderRadius: 8, padding: "4px 8px",
              color: "#ef4444", fontSize: 12, cursor: "pointer",
            }}
          >
            🗑
          </button>
        )}
      </div>

      {/* Time + read receipts */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        marginTop: 3, marginLeft: isMine ? 0 : 4,
      }}>
        <span style={{ fontSize: 11, color: "#444" }}>
          {formatTime(message.created_at)}
        </span>
        {isMine && message.read_by?.length > 0 && (
          <span style={{ fontSize: 11, color: "#3b82f6" }}>✓✓</span>
        )}
      </div>
    </div>
  );
}