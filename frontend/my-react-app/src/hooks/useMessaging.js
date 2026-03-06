// hooks/useMessaging.js
import { useState, useCallback, useRef, useEffect } from "react";
import axiosService from "../components/helpers/axios";
import { authManager } from "../components/helpers/authManager";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
const WS_URL = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://");

function useMessaging() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isFetching = useRef(false);

  // Keep a stable ref to handleWSEvent to avoid stale closures in ws.onmessage
  const handleWSEventRef = useRef(null);

  // ─── REST API ────────────────────────────────────────────────────

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

  const loadMessages = useCallback(async (conversationId, beforeId = null) => {
    setLoadingMessages(true);
    try {
      const url = beforeId
        ? `/api/messaging/conversations/${conversationId}/messages/?before=${beforeId}`
        : `/api/messaging/conversations/${conversationId}/messages/`;
      const res = await axiosService.get(url);
      const { results, has_more } = res.data;

      if (beforeId) {
        setMessages(prev => [...results, ...prev]);
      } else {
        setMessages(results);
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
    setConversations(prev => [newConv, ...prev.filter(c => c.id !== newConv.id)]);
    return newConv;
  }, []);

  const sendMessageREST = useCallback(async (conversationId, { content, media, replyTo }) => {
    const formData = new FormData();
    // FIX: Explicitly encode Arabic/UTF-8 content as a Blob to guarantee encoding
    if (content) {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      formData.append("content", blob, "content.txt");
    }
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

  const connectWS = useCallback((conversationId) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const token = authManager.getAccessToken();
    if (!token) return;

    // FIX: Use a stable ref for onmessage so it never goes stale
    const wsEndpoint = `${WS_URL}/ws/chat/${conversationId}/?token=${token}`;
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    // FIX: Always call through the ref so we get the latest handleWSEvent
    ws.onmessage = (event) => {
      // FIX: Explicitly decode as UTF-8 to support Arabic and all Unicode text
      const text = typeof event.data === "string"
        ? event.data
        : new TextDecoder("utf-8").decode(event.data);
      const data = JSON.parse(text);
      if (handleWSEventRef.current) {
        handleWSEventRef.current(data);
      }
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

  const openConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    // FIX: Reset typing/online state when switching conversations
    setTypingUsers({});
    setOnlineUsers(new Set());
    loadMessages(conversation.id);
    connectWS(conversation.id);
    setConversations(prev => prev.map(c =>
      c.id === conversation.id ? { ...c, unread_count: 0 } : c
    ));
  }, [loadMessages, connectWS]);

  // ─── WS Event Handler ────────────────────────────────────────────

  const handleWSEvent = useCallback((data) => {
    switch (data.type) {

      case 'chat.message':
        setMessages(prev => {
          // Deduplicate by id — also replaces any optimistic message with same tempId
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

      case 'chat.translation.ready':
        setMessages(prev => prev.map(m =>
          m.id === data.message_id
            ? {
                ...m,
                content: data.translated_content,
                original_content: m.content,
                is_translated: true,
                target_language: data.target_language,
              }
            : m
        ));
        break;

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

  // FIX: Keep the ref in sync with the latest handleWSEvent on every render
  useEffect(() => {
    handleWSEventRef.current = handleWSEvent;
  }, [handleWSEvent]);

  // ─── WS Send helpers ─────────────────────────────────────────────

  const sendWSMessage = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // FIX: JSON.stringify handles Unicode/Arabic natively — no extra encoding needed
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const sendMessage = useCallback(async (conversationId, { content, media, replyTo }) => {
    if (media) {
      const msg = await sendMessageREST(conversationId, { content, media, replyTo });
      setMessages(prev => [...prev, msg]);
      // FIX: Also update conversation sidebar for media messages
      setConversations(prev => prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              last_message: {
                id: msg.id,
                sender: msg.sender?.full_name,
                content: msg.content,
                message_type: msg.message_type,
                created_at: msg.created_at,
              },
              updated_at: msg.created_at,
            }
          : c
      ));
      return msg;
    }

    const sent = sendWSMessage({
      type: 'chat.message',
      content,          // Arabic UTF-8 strings are safe inside JSON
      reply_to: replyTo || null,
    });

    if (!sent) {
      // WS closed → fall back to REST
      const msg = await sendMessageREST(conversationId, { content, replyTo });
      setMessages(prev => [...prev, msg]);
      // FIX: Update sidebar on REST fallback too
      setConversations(prev => prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              last_message: {
                id: msg.id,
                sender: msg.sender?.full_name,
                content: msg.content,
                message_type: msg.message_type,
                created_at: msg.created_at,
              },
              updated_at: msg.created_at,
            }
          : c
      ));
      return msg;
    }
    // WS sent: the server will echo back a 'chat.message' event which
    // handleWSEvent will pick up and add to messages for both sender & receiver.
  }, [sendWSMessage, sendMessageREST]);

  const sendTyping = useCallback((isTyping) => {
    sendWSMessage({ type: 'chat.typing', is_typing: isTyping });
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

  useEffect(() => {
    return () => {
      disconnectWS();
      clearTimeout(typingTimerRef.current);
    };
  }, [disconnectWS]);

  return {
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