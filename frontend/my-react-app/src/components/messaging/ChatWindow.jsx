// components/messaging/ChatWindow.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { authManager } from "../helpers/authManager";
import MessageBubble from "./MessageBubble";
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
  onSendMessage,
  onTyping,
  onDeleteMessage,
  onLoadMore,
  onToggleTranslation,
  onReadReceipts,
}) {
  const currentUser   = authManager.getUser();
  const bottomRef     = useRef(null);
  const messagesRef   = useRef(null);
  const [replyTo, setReplyTo]             = useState(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const prevMessagesLen                   = useRef(0);

  // Get other participant name
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLen.current = messages.length;
  }, [messages.length]);

  // Mark unread messages as read when window is visible
  useEffect(() => {
    if (!messages.length || !onReadReceipts) return;
    const unreadIds = messages
      .filter(m => m.sender?.id !== currentUser?.id)
      .filter(m => !m.read_by?.some(r => r.user?.id === currentUser?.id))
      .map(m => m.id);
    if (unreadIds.length > 0) onReadReceipts(unreadIds);
  }, [messages, currentUser?.id]);

  // Infinite scroll — load more when scrolled to top
  const handleScroll = useCallback(() => {
    if (!messagesRef.current || !hasMoreMessages) return;
    if (messagesRef.current.scrollTop < 60) {
      onLoadMore?.();
    }
  }, [hasMoreMessages, onLoadMore]);

  const handleSend = useCallback(async (payload) => {
    await onSendMessage(conversation.id, payload);
  }, [conversation?.id, onSendMessage]);

  const handleDelete = useCallback(async (messageId) => {
    await onDeleteMessage(conversation.id, messageId);
  }, [conversation?.id, onDeleteMessage]);

  // ─── Empty state ─────────────────────────────────────────────────

  if (!conversation) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a0a10", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center", color: "#333" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#444" }}>Select a conversation</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Choose from the list to start messaging</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: "#0a0a10", height: "100%",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid #1e1e2e",
        background: "#0f0f13",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f1f1" }}>
              {getTitle()}
            </div>
            <div style={{
              fontSize: 12,
              color: isOnline() ? "#10b981" : "#555",
            }}>
              {getSubtitle()}
            </div>
          </div>
        </div>

        {/* Translation toggle */}
        <TranslationToggle
          conversation={conversation}
          onToggle={onToggleTranslation}
        />
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: "auto", padding: "12px 0",
          display: "flex", flexDirection: "column", gap: 2,
        }}
      >
        {/* Load more */}
        {hasMoreMessages && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <button onClick={onLoadMore} style={{
              background: "none", border: "1px solid #2a2a3e",
              borderRadius: 8, padding: "6px 16px",
              color: "#555", fontSize: 12, cursor: "pointer",
            }}>
              Load older messages
            </button>
          </div>
        )}

        {loadingMessages && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: "#444", fontSize: 13 }}>
            Loading messages…
          </div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: "#333", fontSize: 13 }}>
            No messages yet. Say hello! 👋
          </div>
        )}

        {/* Group messages by date */}
        {messages.map((message, idx) => {
          const prevMsg  = messages[idx - 1];
          const msgDate  = new Date(message.created_at).toDateString();
          const prevDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
          const showDate = msgDate !== prevDate;

          return (
            <React.Fragment key={message.id}>
              {showDate && (
                <div style={{
                  textAlign: "center", padding: "12px 0 4px",
                  fontSize: 11, color: "#444",
                }}>
                  {msgDate === new Date().toDateString() ? "Today" : msgDate}
                </div>
              )}
              <MessageBubble
                message={message}
                onDelete={handleDelete}
                onReply={setReplyTo}
                showTranslation={showTranslation && (conversation.translation_enabled ?? true)}
              />
            </React.Fragment>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── Typing indicator ── */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* ── Input ── */}
      <MessageInput
        onSend={handleSend}
        onTyping={onTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={!wsConnected && messages.length === 0}
      />
    </div>
  );
}