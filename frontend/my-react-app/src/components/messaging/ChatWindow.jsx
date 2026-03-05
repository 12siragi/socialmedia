// src/components/messaging/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

// =============================================================================
// TRUTH LAYER 1: ChatWindow state truths
// messages: True if loaded
// wsConnected: True = live, False = offline (show indicator)
// hasMore: True = more messages above
// typingUsers: True if object has keys
// =============================================================================

function ChatWindow({
  conversation, messages, currentUser, wsConnected,
  loading, hasMore, typingUsers, onlineUsers,
  onSend, onTyping, onReadReceipts, onDelete, onLoadMore
}) {
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null); // True if replying

  // EFFECT CONNECTION: new messages → scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // EFFECT CONNECTION: messages loaded → send read receipts
  useEffect(() => {
    if (messages.length === 0) return;
    const unread = messages
      .filter(m => !m.is_deleted && m.sender?.id !== currentUser?.id)
      .filter(m => !m.read_by?.some(r => r.user?.id === currentUser?.id))
      .map(m => m.id);

    if (unread.length > 0) onReadReceipts(unread);
  }, [messages]);

  // EFFECT CONNECTION: top of messages → IntersectionObserver for load more
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    if (topRef.current) observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const getOtherParticipant = () => {
    if (conversation.is_group) return null;
    return conversation.participants?.find(p => p.id !== currentUser?.id);
  };

  const getHeaderTitle = () => {
    if (conversation.is_group) return conversation.name;
    return getOtherParticipant()?.full_name || "Unknown";
  };

  const getHeaderSubtitle = () => {
    const other = getOtherParticipant();
    // TRUTH GATE: isOnline = True → "Online", False → "Offline"
    if (other) {
      return onlineUsers.has(other.id) ? "Online" : "Offline";
    }
    return `${conversation.participants?.length || 0} members`;
  };

  const getHeaderAvatar = () => {
    if (conversation.is_group) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name || "G")}&background=7c3aed&color=fff&bold=true`;
    }
    const other = getOtherParticipant();
    if (other?.avatar_url?.startsWith("http")) return other.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.full_name || "U")}&background=7c3aed&color=fff&bold=true`;
  };

  const typingList = Object.values(typingUsers);
  const isTyping = typingList.length > 0; // True if anyone typing

  const handleSend = useCallback(async (payload) => {
    await onSend({ ...payload, replyTo: replyTo?.id });
    setReplyTo(null); // clear reply after send
  }, [onSend, replyTo]);

  return (
    <div className="chat-window">

      {/* Header */}
      <div className="chat-header">
        <div className="d-flex align-items-center gap-2">
          <div className="chat-header-avatar-wrap">
            <img src={getHeaderAvatar()} alt="" className="chat-header-avatar" />
            {/* TRUTH GATE: other user online → green dot */}
            {!conversation.is_group && onlineUsers.has(getOtherParticipant()?.id) && (
              <span className="online-dot" />
            )}
          </div>
          <div>
            <div className="chat-header-name">{getHeaderTitle()}</div>
            <div className={`chat-header-status ${onlineUsers.has(getOtherParticipant()?.id) ? "online" : "offline"}`}>
              {getHeaderSubtitle()}
            </div>
          </div>
        </div>

        {/* TRUTH GATE: wsConnected = False → show offline pill */}
        {!wsConnected && (
          <span className="ws-offline-pill">
            <i className="bi bi-wifi-off me-1" />
            Reconnecting...
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="chat-messages">

        {/* Load more sentinel */}
        <div ref={topRef} />

        {/* TRUTH GATE: loading = True → spinner at top */}
        {loading && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        )}

        {/* TRUTH GATE: no messages → empty state */}
        {!loading && messages.length === 0 && (
          <div className="chat-empty">
            <p className="text-muted">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, index) => {
          const isOwn = msg.sender?.id === currentUser?.id;
          const prevMsg = messages[index - 1];
          // GROUP TRUTH: same sender as prev → compact (no avatar repeat)
          const showAvatar = !prevMsg || prevMsg.sender?.id !== msg.sender?.id;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              showAvatar={showAvatar}
              currentUser={currentUser}
              onReply={() => setReplyTo(msg)}
              onDelete={() => onDelete(msg.id)}
            />
          );
        })}

        {/* TRUTH GATE: isTyping = True → typing indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span /><span /><span />
            </span>
            <span className="typing-text">
              {typingList.length === 1
                ? `${typingList[0]} is typing`
                : `${typingList.length} people are typing`}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {/* TRUTH GATE: replyTo = True → show reply bar */}
      {replyTo && (
        <div className="reply-preview">
          <div className="reply-preview-content">
            <span className="reply-preview-sender">{replyTo.sender?.full_name}</span>
            <span className="reply-preview-text">
              {replyTo.is_deleted ? "Deleted message" : replyTo.content}
            </span>
          </div>
          <button className="reply-preview-close" onClick={() => setReplyTo(null)}>
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={onTyping}
        wsConnected={wsConnected}
      />
    </div>
  );
}

export default ChatWindow;