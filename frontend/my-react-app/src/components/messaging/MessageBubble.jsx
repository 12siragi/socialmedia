// src/components/messaging/MessageBubble.jsx
import React, { useState } from "react";

// =============================================================================
// TRUTH LAYER 2: Render message based on truths
// isOwn = True  → right-aligned blue bubble
// isOwn = False → left-aligned grey bubble
// is_deleted = True → show "Deleted message" placeholder
// message_type != text → show media
// =============================================================================

function MessageBubble({ message, isOwn, showAvatar, currentUser, onReply, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  const getAvatar = () => {
    const url = message.sender?.avatar_url || "";
    if (url.startsWith("http")) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.full_name || "U")}&background=7c3aed&color=fff&bold=true`;
  };

  const getTimeStr = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isReadByOthers = message.read_by?.some(r => r.user?.id !== currentUser?.id);

  return (
    <div
      className={`message-row ${isOwn ? "own" : "other"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* TRUTH GATE: !isOwn && showAvatar = True → show avatar */}
      {!isOwn && (
        <div className="message-avatar-col">
          {showAvatar ? (
            <img src={getAvatar()} alt="" className="message-avatar" />
          ) : (
            <div className="message-avatar-spacer" />
          )}
        </div>
      )}

      <div className="message-col">
        {/* Sender name for group chats */}
        {!isOwn && showAvatar && (
          <div className="message-sender-name">{message.sender?.full_name}</div>
        )}

        {/* Reply preview */}
        {message.reply_to_preview && (
          <div className="message-reply-preview">
            <span className="reply-sender">{message.reply_to_preview.sender}</span>
            <span className="reply-content">{message.reply_to_preview.content}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`message-bubble ${isOwn ? "own" : "other"}`}>

          {/* TRUTH GATE: is_deleted = True → placeholder */}
          {message.is_deleted ? (
            <span className="deleted-message">
              <i className="bi bi-slash-circle me-1" />
              Message deleted
            </span>
          ) : (
            <>
              {/* TRUTH GATE: media type → render correct element */}
              {message.message_type === "image" && message.media_url && (
                <img src={message.media_url} alt="Media" className="message-media-img" />
              )}
              {message.message_type === "video" && message.media_url && (
                <video src={message.media_url} controls className="message-media-video" />
              )}
              {message.message_type === "file" && message.media_url && (
                <a href={message.media_url} target="_blank" rel="noreferrer" className="message-file-link">
                  <i className="bi bi-file-earmark me-1" />
                  Download file
                </a>
              )}
              {/* Text content */}
              {message.content && (
                <p className="message-text">{message.content}</p>
              )}
            </>
          )}
        </div>

        {/* Meta row */}
        <div className={`message-meta ${isOwn ? "justify-content-end" : ""}`}>
          <span className="message-time">{getTimeStr(message.created_at)}</span>
          {/* TRUTH GATE: isOwn && isReadByOthers = True → double tick */}
          {isOwn && (
            <span className={`read-tick ${isReadByOthers ? "read" : ""}`}>
              <i className={`bi ${isReadByOthers ? "bi-check2-all" : "bi-check2"}`} />
            </span>
          )}
        </div>
      </div>

      {/* TRUTH GATE: showActions = True && !is_deleted → action buttons */}
      {showActions && !message.is_deleted && (
        <div className={`message-actions ${isOwn ? "left" : "right"}`}>
          <button className="msg-action-btn" onClick={onReply} title="Reply">
            <i className="bi bi-reply" />
          </button>
          {/* TRUTH GATE: isOwn = True → show delete */}
          {isOwn && (
            <button className="msg-action-btn danger" onClick={onDelete} title="Delete">
              <i className="bi bi-trash" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;