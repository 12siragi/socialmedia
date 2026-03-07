// pages/MessagingPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import useMessaging from "../hooks/useMessaging";
import ConversationList from "../components/messaging/ConversationList";
import ChatWindow from "../components/messaging/ChatWindow";
import { authManager } from "../components/helpers/authManager";
import axiosService from "../components/helpers/axios";

// ─── New Conversation Modal ───────────────────────────────────────────────────

function NewConversationModal({ onClose, onCreate }) {
  const [search, setSearch]       = useState("");
  const [results, setResults]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [isGroup, setIsGroup]     = useState(false);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading]     = useState(false);
  const [creating, setCreating]   = useState(false);

  const handleSearch = useCallback(async (q) => {
    setSearch(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await axiosService.get(`/api/accounts/users/search/?q=${encodeURIComponent(q)}`);
      setResults(res.data?.results ?? res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = async () => {
    if (!selected || creating) return;
    setCreating(true);
    try {
      await onCreate({
        participantIds: [selected.id],
        isGroup,
        name: isGroup ? groupName : "",
      });
      onClose();
    } catch (e) {
      console.error("Failed to create conversation:", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0f0f13", border: "1px solid #1e1e2e",
        borderRadius: 16, width: 420, maxWidth: "90vw",
        padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f1f1" }}>
            New Conversation
          </h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#555",
            cursor: "pointer", fontSize: 20,
          }}>×</button>
        </div>

        {/* Search */}
        <input
          autoFocus
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search users…"
          style={{
            width: "100%", background: "#1a1a2e", border: "1px solid #2a2a3e",
            borderRadius: 10, padding: "10px 14px", color: "#e8e8f0",
            fontSize: 14, outline: "none", boxSizing: "border-box",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />

        {/* Results */}
        <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 10 }}>
          {loading && (
            <div style={{ padding: 12, color: "#555", fontSize: 13, textAlign: "center" }}>
              Searching…
            </div>
          )}
          {!loading && results.map(user => (
            <div
              key={user.id}
              onClick={() => setSelected(user)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                background: selected?.id === user.id ? "#1a1a2e" : "transparent",
                border: selected?.id === user.id ? "1px solid #3b82f6" : "1px solid transparent",
                marginBottom: 4, transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#3b82f6", display: "flex", alignItems: "center",
                justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13,
              }}>
                {user.full_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f1f1" }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  @{user.username || user.email}
                </div>
              </div>
              {selected?.id === user.id && (
                <span style={{ marginLeft: "auto", color: "#3b82f6", fontSize: 16 }}>✓</span>
              )}
            </div>
          ))}
        </div>

        {/* Group toggle */}
        {selected && (
          <div style={{ marginTop: 16 }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              cursor: "pointer", fontSize: 13, color: "#888",
            }}>
              <input
                type="checkbox"
                checked={isGroup}
                onChange={e => setIsGroup(e.target.checked)}
                style={{ accentColor: "#3b82f6" }}
              />
              Create as group conversation
            </label>
            {isGroup && (
              <input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Group name…"
                style={{
                  marginTop: 10, width: "100%", background: "#1a1a2e",
                  border: "1px solid #2a2a3e", borderRadius: 10,
                  padding: "10px 14px", color: "#e8e8f0", fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            )}
          </div>
        )}

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={!selected || creating || (isGroup && !groupName.trim())}
          style={{
            marginTop: 20, width: "100%", padding: "11px 0",
            background: (!selected || creating || (isGroup && !groupName.trim()))
              ? "#1e1e2e" : "#3b82f6",
            border: "none", borderRadius: 10, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor:
              (!selected || creating || (isGroup && !groupName.trim()))
                ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {creating ? "Creating…" : "Start Conversation"}
        </button>
      </div>
    </div>
  );
}

// ─── Messaging Page ───────────────────────────────────────────────────────────

export default function MessagingPage() {
  const [showNewConv, setShowNewConv] = useState(false);

  const {
    conversations,
    activeConversation,
    messages,
    wsConnected,
    loadingConversations,
    loadingMessages,
    hasMoreMessages,
    typingUsers,
    onlineUsers,
    error,

    loadConversations,
    openConversation,
    createConversation,
    sendMessage,
    sendTyping,
    sendReadReceipts,
    deleteMessage,
    loadMoreMessages,
    toggleTranslation,
  } = useMessaging();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleCreateConversation = useCallback(async (payload) => {
    const conv = await createConversation(payload);
    openConversation(conv);
  }, [createConversation, openConversation]);

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100%",
      background: "#0a0a10", overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a4e; }
      `}</style>

      {/* Sidebar — Conversation List */}
      <ConversationList
        conversations={conversations}
        activeConversation={activeConversation}
        onlineUsers={onlineUsers}
        loadingConversations={loadingConversations}
        onSelect={openConversation}
        onNewConversation={() => setShowNewConv(true)}
      />

      {/* Main — Chat Window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Error banner */}
        {error && (
          <div style={{
            background: "#2d1515", borderBottom: "1px solid #ef4444",
            padding: "8px 16px", fontSize: 13, color: "#ef4444",
            display: "flex", justifyContent: "space-between",
          }}>
            {error}
          </div>
        )}

        {/* WS status bar */}
        {activeConversation && !wsConnected && (
          <div style={{
            background: "#1a1500", borderBottom: "1px solid #f59e0b",
            padding: "6px 16px", fontSize: 12, color: "#f59e0b",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#f59e0b", animation: "pulse 1.5s infinite",
            }} />
            Reconnecting…
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.3; }
              }
            `}</style>
          </div>
        )}

        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          typingUsers={typingUsers}
          onlineUsers={onlineUsers}
          wsConnected={wsConnected}
          loadingMessages={loadingMessages}
          hasMoreMessages={hasMoreMessages}
          onSendMessage={sendMessage}
          onTyping={sendTyping}
          onDeleteMessage={deleteMessage}
          onLoadMore={() => loadMoreMessages(activeConversation?.id)}
          onToggleTranslation={toggleTranslation}
          onReadReceipts={sendReadReceipts}
        />
      </div>

      {/* New Conversation Modal */}
      {showNewConv && (
        <NewConversationModal
          onClose={() => setShowNewConv(false)}
          onCreate={handleCreateConversation}
        />
      )}
    </div>
  );
}