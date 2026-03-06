// hooks/useMessaging.js
import { useState, useCallback, useRef, useEffect } from "react";
import axiosService from "../components/helpers/axios";
import { authManager } from "../components/helpers/authManager";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
const WS_URL = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://");

// =============================================================================
// TRUTH LAYER 1: All messaging state in one hook
// conversations: True if loaded, [] if empty, null if not yet fetched
// activeConversation: True if selected, null if none
// messages: True if loaded for activeConversation
// wsConnected: True if WebSocket open, False if closed/error
// =============================================================================

function useMessaging() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: fullName }
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isFetching = useRef(false);

  // ─── REST API ────────────────────────────────────────────────────

  // TRUTH GATE: conversations load only once
  const loadConversations = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoadingConversations(true);
    setError(null);
    try {
      const res = await axiosService.get("/api/messaging/conversations/");
      setConversations(res.data);
    } catch (err) {
      setError("Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
      isFetching.current = false;
    }
  }, []);

  // TRUTH GATE: messages load only when activeConversation is True
  const loadMessages = useCallback(async (conversationId, beforeId = null) => {
    setLoadingMessages(true);
    try {
      const url = beforeId
        ? `/api/messaging/conversations/${conversationId}/messages/?before=${beforeId}`
        : `/api/messaging/conversations/${conversationId}/messages/`;
      const res = await axiosService.get(url);
      const { results, has_more } = res.data;

      if (beforeId) {
        setMessages(prev => [...results, ...prev]); // prepend older messages
      } else {
        setMessages(results); // fresh load
      }
      setHasMoreMessages(has_more);
    } catch (err) {
      setError("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const createConversation = useCallback(async ({ participantIds, isGroup = false, name = "" }) => {
    const res = await axiosService.post("/api/messaging/conversations/", {
      participant_ids: participantIds,
      is_group: isGroup,
      name,
    });
    const newConv = res.data;
    // Prepend to list — newest first
    setConversations(prev => [newConv, ...prev.filter(c => c.id !== newConv.id)]);
    return newConv;
  }, []);

  const sendMessageREST = useCallback(async (conversationId, { content, media, replyTo }) => {
    const formData = new FormData();
    if (content) formData.append("content", content);
    if (media) formData.append("media", media);
    if (replyTo) formData.append("reply_to", replyTo);

    const res = await axiosService.post(
      `/api/messaging/conversations/${conversationId}/messages/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    await axiosService.delete(`/api/messaging/messages/${messageId}/`);
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, is_deleted: true, content: null } : m
    ));
  }, []);

  // ─── WebSocket ───────────────────────────────────────────────────

  // CONNECTION TRUTH: wsConnected = True only when WS open + authenticated
  const connectWS = useCallback((conversationId) => {
    // Close existing connection first
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const token = authManager.getAccessToken();
    if (!token) return; // token = False → don't connect

    const wsEndpoint = `${WS_URL}/ws/chat/${conversationId}/?token=${token}`;
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true); // Connection = True
    };

    ws.onclose = () => {
      setWsConnected(false); // Connection = False
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWSEvent(data);
    };
  }, []);

  const disconnectWS = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
    setTypingUsers({});
    setOnlineUsers(new Set());
  }, []);

  // EFFECT CONNECTION: activeConversation → connect WS, load messages
  const openConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    loadMessages(conversation.id);
    connectWS(conversation.id);

    // Mark as read — update unread count locally
    setConversations(prev => prev.map(c =>
      c.id === conversation.id ? { ...c, unread_count: 0 } : c
    ));
  }, [loadMessages, connectWS]);

  // ─── WS Event Handler ────────────────────────────────────────────

// ─── WS Event Handler ────────────────────────────────────────────

  const handleWSEvent = useCallback((data) => {
    switch (data.type) {

      case 'chat.message':
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setConversations(prev => prev.map(c =>
          c.id === data.message.conversation
            ? {
                ...c,
                last_message: {
                  id: data.message.id,
                  sender: data.message.sender.full_name,
                  content: data.message.content,
                  message_type: data.message.message_type,
                  created_at: data.message.created_at,
                },
                updated_at: data.message.created_at,
              }
            : c
        ));
        setTypingUsers(prev => {
          const next = { ...prev };
          delete next[data.message.sender.id];
          return next;
        });
        break;

      case 'chat.typing':
        setTypingUsers(prev => {
          if (data.is_typing) {
            return { ...prev, [data.user_id]: data.full_name };
          } else {
            const next = { ...prev };
            delete next[data.user_id];
            return next;
          }
        });
        break;

      case 'chat.read':
        setMessages(prev => prev.map(m =>
          data.message_ids.includes(m.id)
            ? { ...m, read_by: [...(m.read_by || []), { user: { id: data.user_id } }] }
            : m
        ));
        break;

      case 'chat.message.delete':
        setMessages(prev => prev.map(m =>
          m.id === data.message_id ? { ...m, is_deleted: true, content: null } : m
        ));
        break;

      // ── AI TRANSLATION ───────────────────────────────────────────
      // TRUTH GATE:
      // message_id matches = True  → update content in-place
      // message_id no match = False → leave unchanged
      // is_translated = True → MessageBubble shows translate badge
      // original_content saved → user can toggle "see original"
      case 'chat.translation.ready':
        setMessages(prev => prev.map(m =>
          m.id === data.message_id
            ? {
                ...m,
                content: data.translated_content,  // Receiver sees translation
                original_content: m.content,        // Original preserved for toggle
                is_translated: true,                // True → show badge
                target_language: data.target_language,
              }
            : m
        ));
        break;
      // ─────────────────────────────────────────────────────────────

      case 'user.online':
        setOnlineUsers(prev => new Set([...prev, data.user_id]));
        break;

      case 'user.offline':
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(data.user_id);
          return next;
        });
        break;

      default:
        break;
    }
  }, []);

  // ─── WS Send helpers ─────────────────────────────────────────────

  const sendWSMessage = useCallback((payload) => {
    // TRUTH GATE: only send if WS is True (open)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false; // WS = False → fallback to REST
  }, []);

  const sendMessage = useCallback(async (conversationId, { content, media, replyTo }) => {
    if (media) {
      // Media must go via REST (WebSocket can't handle binary)
      const msg = await sendMessageREST(conversationId, { content, media, replyTo });
      setMessages(prev => [...prev, msg]);
      return msg;
    }

    // Text: try WS first, fallback to REST
    const sent = sendWSMessage({
      type: 'chat.message',
      content,
      reply_to: replyTo || null,
    });

    if (!sent) {
      // WS = False → use REST fallback
      const msg = await sendMessageREST(conversationId, { content, replyTo });
      setMessages(prev => [...prev, msg]);
      return msg;
    }
  }, [sendWSMessage, sendMessageREST]);

  const sendTyping = useCallback((isTyping) => {
    sendWSMessage({ type: 'chat.typing', is_typing: isTyping });

    // Auto-stop typing after 3s
    if (isTyping) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendWSMessage({ type: 'chat.typing', is_typing: false });
      }, 3000);
    }
  }, [sendWSMessage]);

  const sendReadReceipts = useCallback((messageIds) => {
    if (messageIds.length === 0) return;
    sendWSMessage({ type: 'chat.read', message_ids: messageIds });
  }, [sendWSMessage]);

  // ─── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnectWS();
      clearTimeout(typingTimerRef.current);
    };
  }, [disconnectWS]);

  return {
    // State truths
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

    // Actions
    loadConversations,
    loadMessages,
    createConversation,
    openConversation,
    sendMessage,
    sendTyping,
    sendReadReceipts,
    deleteMessage,
    disconnectWS,
  };
}

export default useMessaging;