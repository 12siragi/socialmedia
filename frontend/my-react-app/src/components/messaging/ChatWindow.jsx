// src/components/messaging/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

function ChatWindow({
  conversation, messages, currentUser, wsConnected,
  loading, hasMore, typingUsers, onlineUsers,
  onSend, onTyping, onReadReceipts, onDelete, onLoadMore,
  onTranslate,
}) {
  const bottomRef = useRef(null);
  const topRef    = useRef(null);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0) return;
    const unread = messages
      .filter(m => !m.is_deleted && m.sender?.id !== currentUser?.id)
      .filter(m => !m.read_by?.some(r => r.user?.id === currentUser?.id))
      .map(m => m.id);
    if (unread.length > 0) onReadReceipts(unread);
  }, [messages]);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    if (topRef.current) observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  // FIX: Use == (loose equality) so "123" == 123 → true
  // Prevents type mismatch between currentUser.id (string from JWT)
  // and participant.id (number from API)
  const getOtherParticipant = () => {
    if (conversation.is_group) return null;
    // eslint-disable-next-line eqeqeq
    return conversation.participants?.find(p => p.id != currentUser?.id);
  };

  const getReceiverLanguage = () => {
    if (conversation.is_group) return null;
    const other = getOtherParticipant();
    const lang = other?.preferred_language || 'en';
    console.debug('[ChatWindow] receiver:', other?.full_name, '| lang:', lang); // debug
    return lang;
  };

  const getHeaderTitle = () => {
    if (conversation.is_group) return conversation.name;
    return getOtherParticipant()?.full_name || "Unknown";
  };

  const getHeaderSubtitle = () => {
    const other = getOtherParticipant();
    if (other) return onlineUsers.has(other.id) ? "Online" : "Offline";
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

  const typingList  = Object.values(typingUsers);
  const isTyping    = typingList.length > 0;
  const receiverLang = getReceiverLanguage();

  const handleSend = useCallback(async (payload) => {
    await onSend({ ...payload, replyTo: replyTo?.id });
    setReplyTo(null);
  }, [onSend, replyTo]);

  return (
    <div className="chat-window">

      {/* Header */}
      <div className="chat-header">
        <div className="d-flex align-items-center gap-2">
          <div className="chat-header-avatar-wrap">
            <img src={getHeaderAvatar()} alt="" className="chat-header-avatar" />
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

        {!wsConnected && (
          <span className="ws-offline-pill">
            <i className="bi bi-wifi-off me-1" />
            Reconnecting...
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        <div ref={topRef} />

        {loading && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="chat-empty">
            <p className="text-muted">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isOwn      = msg.sender?.id === currentUser?.id;
          const prevMsg    = messages[index - 1];
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

        {isTyping && (
          <div className="typing-indicator">
            <span className="typing-dots"><span /><span /><span /></span>
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
        onTranslate={!conversation.is_group ? onTranslate : null}
        receiverLanguage={receiverLang || 'en'}
      />
    </div>
  );
}

export default ChatWindow;