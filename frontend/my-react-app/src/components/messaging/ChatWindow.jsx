// components/messaging/ChatWindow.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { authManager } from "../helpers/authManager";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import TranslationToggle from "./TranslationToggle";

const Avatar = ({ name = "", size = 32 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors   = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444"];
  const color    = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff",
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
};

export default function ChatWindow({
  conversation,
  messages = [],
  typingUsers = {},
  onlineUsers = new Set(),
  wsConnected,
  loadingMessages,
  hasMoreMessages,
  currentUser,
  onSendMessage,
  onTyping,
  onDeleteMessage,
  onLoadMore,
  onToggleTranslation,
  onRequestAudio,
  onReadReceipts,
  onBackToList,
}) {
  const bottomRef       = useRef(null);
  const messagesRef     = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const prevMessagesLen = useRef(0);
  const prevFirstMsgId  = useRef(null);
  const scrollDebounce  = useRef(null);

  const getTitle = () => {
    if (!conversation) return "";
    if (conversation.is_group) return conversation.name || "Group";
    const other = conversation.participants?.find(p => p.id !== currentUser?.id);
    return other?.full_name || "Unknown";
  };

  const getSubtitle = () => {
    if (!conversation) return "";
    const other = conversation.participants?.find(p => p.id !== currentUser?.id);
    if (other && onlineUsers.has(other.id)) return "Online";
    if (wsConnected) return "Connected";
    return "Offline";
  };

  const isOnline = () => {
    if (!conversation || conversation.is_group) return wsConnected;
    const other = conversation.participants?.find(p => p.id !== currentUser?.id);
    return other ? onlineUsers.has(other.id) : false;
  };

  // Auto-scroll only on new messages, not on prepend (load more)
  useEffect(() => {
    const currentLen     = messages.length;
    const currentFirstId = messages[0]?.id;
    const olderPrepended = currentFirstId !== prevFirstMsgId.current && prevMessagesLen.current > 0;

    if (currentLen > prevMessagesLen.current && !olderPrepended) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevMessagesLen.current = currentLen;
    prevFirstMsgId.current  = currentFirstId;
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!messages.length || !onReadReceipts) return;
    const unreadIds = messages
      .filter(m => m.sender?.id !== currentUser?.id)
      .filter(m => !m.is_deleted)
      .filter(m => !(m.read_by ?? []).some(r => r.user?.id === currentUser?.id))
      .map(m => m.id);
    if (unreadIds.length > 0) onReadReceipts(unreadIds);
  }, [messages, currentUser?.id]);

  // Infinite scroll with debounce
  const handleScroll = useCallback(() => {
    if (!messagesRef.current || !hasMoreMessages) return;
    if (messagesRef.current.scrollTop < 60) {
      if (scrollDebounce.current) return;
      scrollDebounce.current = setTimeout(() => {
        onLoadMore?.();
        scrollDebounce.current = null;
      }, 300);
    }
  }, [hasMoreMessages, onLoadMore]);

  const handleDelete = useCallback(async (messageId) => {
    await onDeleteMessage(conversation.id, messageId);
  }, [conversation?.id, onDeleteMessage]);

  if (!conversation) {
    return (
      <div className="messages-empty">
        <i className="bi bi-chat-dots display-1 text-muted" />
        <h5 className="mt-3 text-muted">Select a conversation</h5>
      </div>
    );
  }

  return (
    <div className="chat-window">

      {/* Header */}
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onBackToList && (
            <button
              className="mobile-back-btn"
              onClick={onBackToList}
              aria-label="Back to conversations"
            >
              <i className="bi bi-arrow-left" />
            </button>
          )}
          <div style={{ position: "relative" }}>
            <Avatar name={getTitle()} size={36} />
            {isOnline() && (
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 10, height: 10, borderRadius: "50%",
                background: "#10b981", border: "2px solid #0f0f13",
              }} />
            )}
          </div>
          <div>
            <div className="chat-header-name">{getTitle()}</div>
            <div className={`chat-header-status ${isOnline() ? "online" : ""}`}>
              {getSubtitle()}
            </div>
          </div>
        </div>

        <TranslationToggle
          conversation={conversation}
          onToggle={onToggleTranslation}
        />
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="messages-list"
        onScroll={handleScroll}
      >
        {hasMoreMessages && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <button className="btn btn-sm btn-outline-secondary" onClick={onLoadMore}>
              Load older messages
            </button>
          </div>
        )}

        {loadingMessages && messages.length === 0 && (
          <div className="messages-loading">Loading messages…</div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div className="messages-empty-chat">No messages yet. Say hello! 👋</div>
        )}

        {/* Date dividers + messages */}
        {(() => {
          const elements = [];
          let lastDate = null;

          messages.forEach((message, idx) => {
            const msgDate = new Date(message.created_at).toDateString();
            if (msgDate !== lastDate) {
              elements.push(
                <div key={`date-${message.id}`} className="message-date-divider">
                  {msgDate === new Date().toDateString() ? "Today" : msgDate}
                </div>
              );
              lastDate = msgDate;
            }
          });

          elements.push(
            <MessageList
              key="message-list"
              messages={messages}
              activeConversation={conversation}
              currentUser={currentUser}
              onReply={(msg) => setReplyTo(msg)}
              onDelete={handleDelete}
              onRequestAudio={onRequestAudio}
            />
          );

          return elements;
        })()}

        <div ref={bottomRef} />
      </div>

      <TypingIndicator typingUsers={typingUsers} />

      {/* Reply preview */}
      {replyTo && (
        <div className="reply-preview">
          <div className="reply-preview-content">
            <span className="reply-preview-sender">Replying to {replyTo.sender?.full_name}</span>
            <span className="reply-preview-text">
              {replyTo.content?.slice(0, 50)}{replyTo.content?.length > 50 ? "…" : ""}
            </span>
          </div>
          <button className="reply-preview-close" onClick={() => setReplyTo(null)}>
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      <MessageInput
        onSend={(data) => onSendMessage(conversation.id, data)}
        onTyping={onTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={!wsConnected && messages.length === 0}
      />
    </div>
  );
}