// hooks/useMessaging.js
import { useState, useCallback, useRef, useEffect } from "react";
import axiosService from "../components/helpers/axios";
import { authManager } from "../components/helpers/authManager";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
const WS_URL = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://");

// =============================================================================
// TRUTH LAYER: All messaging state in one hook
// conversations:       loaded = array, empty = [], not fetched = null
// activeConversation:  selected = object, none = null
// messages:            loaded for activeConversation
// wsConnected:         True if WebSocket open, False if closed/error
// =============================================================================

function useMessaging() {
  const [conversations, setConversations]               = useState([]);
  const [activeConversation, setActiveConversation]     = useState(null);
  const [messages, setMessages]                         = useState([]);
  const [wsConnected, setWsConnected]                   = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages]           = useState(false);
  const [hasMoreMessages, setHasMoreMessages]           = useState(false);
  const [nextCursor, setNextCursor]                     = useState(null); // FIX 2: cursor pagination
  const [typingUsers, setTypingUsers]                   = useState({});   // { userId: fullName }
  const [onlineUsers, setOnlineUsers]                   = useState(new Set());
  const [error, setError]                               = useState(null);

  const wsRef              = useRef(null);
  const typingTimerRef     = useRef(null);
  const isFetching         = useRef(false);
  const handleWSEventRef   = useRef(null); // FIX 4: stable WS handler ref
  const activeConvRef      = useRef(null); // track active conv for WS reconnect

  // --- REST API ----------------------------------------------------

  const loadConversations = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoadingConversations(true);
    setError(null);
    try {
      const res = await axiosService.get("/api/chat/conversations/");
      setConversations(res.data);
    } catch (err) {
      setError("Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
      isFetching.current = false;
    }
  }, []);

  // FIX 2: cursor-based pagination - use ?cursor= not ?before=
  const loadMessages = useCallback(async (conversationId, cursor = null) => {
    setLoadingMessages(true);
    try {
      const url = cursor
        ? `/api/chat/conversations/${conversationId}/messages/?cursor=${cursor}`
        : `/api/chat/conversations/${conversationId}/messages/`;
      const res = await axiosService.get(url);

      // DRF CursorPagination returns { next, previous, results }
      const results   = res.data.results  ?? res.data;
      const nextUrl   = res.data.next     ?? null;

      // Extract cursor value from next URL if present
      const nextCursorVal = nextUrl
        ? new URL(nextUrl).searchParams.get("cursor")
        : null;

      if (cursor) {
        // Prepend older messages, dedup by id
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newOnes = results.filter(m => !existingIds.has(m.id));
          return [...newOnes, ...prev];
        });
      } else {
        // Fresh load - deduplicate by id just in case
        const seen = new Set();
        const deduped = results.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setMessages(deduped);
      }
      setNextCursor(nextCursorVal);
      setHasMoreMessages(!!nextCursorVal);
    } catch (err) {
      setError("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadMoreMessages = useCallback((conversationId) => {
    if (hasMoreMessages && nextCursor) {
      loadMessages(conversationId, nextCursor);
    }
  }, [hasMoreMessages, nextCursor, loadMessages]);

  const createConversation = useCallback(async ({ participantIds, isGroup = false, name = "" }) => {
    const res = await axiosService.post("/api/chat/conversations/", {
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
    if (content) formData.append("content", content);
    if (media)   formData.append("media", media);
    if (replyTo) formData.append("reply_to", replyTo);

    const res = await axiosService.post(
      `/api/chat/conversations/${conversationId}/messages/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  }, []);

  // FIX 3: correct delete URL includes conversationId
  const deleteMessage = useCallback(async (conversationId, messageId) => {
    await axiosService.delete(
      `/api/chat/conversations/${conversationId}/messages/${messageId}/`
    );
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, is_deleted: true, content: null } : m
    ));
  }, []);

  const toggleTranslation = useCallback(async (conversationId, isEnabled, targetLanguage = null) => {
    const payload = { is_enabled: isEnabled };
    if (targetLanguage) payload.target_language = targetLanguage;
    if (!isEnabled)     payload.target_language = null;

    const res = await axiosService.post(
      `/api/ai/translation-preference/${conversationId}/`,
      payload,
    );
    // Update both conversations list AND activeConversation
    const updatedFields = {
      translation_enabled: res.data.is_enabled,
      translation_target_language: res.data.target_language,
    };
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, ...updatedFields } : c
    ));
    // FIX: also update activeConversation so ChatWindow re-renders
    setActiveConversation(prev =>
      prev?.id === conversationId ? { ...prev, ...updatedFields } : prev
    );
    return res.data;
  }, []);

  // --- WebSocket ---------------------------------------------------

  const connectWS = useCallback((conversationId) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const token = authManager.getAccessToken();
    if (!token) return;

    const wsEndpoint = `${WS_URL}/ws/chat/${conversationId}/?token=${token}`;
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen  = () => {
      setWsConnected(true);
      // Reload messages on reconnect to catch anything missed during disconnection
      if (activeConvRef.current) {
        loadMessages(activeConvRef.current.id);
      }
    };
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    // FIX 4: always call latest handleWSEvent via ref - avoids stale closure
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWSEventRef.current?.(data);
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
    setNextCursor(null);
    loadMessages(conversation.id);
    connectWS(conversation.id);

    setConversations(prev => prev.map(c =>
      c.id === conversation.id ? { ...c, unread_count: 0 } : c
    ));
  }, [loadMessages, connectWS]);

  // --- WS Event Handler --------------------------------------------

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
                  id:           data.message.id,
                  sender:       data.message.sender.full_name,
                  content:      data.message.content,
                  message_type: data.message.message_type,
                  created_at:   data.message.created_at,
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
          }
          const next = { ...prev };
          delete next[data.user_id];
          return next;
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
          m.id === data.message_id
            ? { ...m, is_deleted: true, content: null }
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

      // FIX 1: handle translation delivery from backend signal
      case 'chat.translation.ready':
        setMessages(prev => {
          const msgId = Number(data.message_id);
          return prev.map(m =>
            Number(m.id) === msgId
              ? {
                  ...m,
                  translation: {
                    translated_content: data.translated_content,
                    target_language:    data.target_language,
                    is_complete:        true,
                    is_failed:          false,
                  },
                }
              : m
          );
        });
        break;

      default:
        break;
    }
  }, []);

  // FIX 4: keep ref in sync with latest handleWSEvent
  useEffect(() => {
    handleWSEventRef.current = handleWSEvent;
  }, [handleWSEvent]);

  // Keep activeConvRef in sync for WS reconnect
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // --- WS Send helpers ---------------------------------------------

  const sendWSMessage = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const sendMessage = useCallback(async (conversationId, { content, media, replyTo }) => {
    if (media) {
      const msg = await sendMessageREST(conversationId, { content, media, replyTo });
      setMessages(prev => [...prev, msg]);
      return msg;
    }

    const sent = sendWSMessage({
      type:     'chat.message',
      content,
      reply_to: replyTo || null,
    });

    if (!sent) {
      const msg = await sendMessageREST(conversationId, { content, replyTo });
      setMessages(prev => [...prev, msg]);
      return msg;
    }
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

  // --- Cleanup -----------------------------------------------------

  useEffect(() => {
    return () => {
      disconnectWS();
      clearTimeout(typingTimerRef.current);
    };
  }, [disconnectWS]);

  return {
    // State
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
    loadMoreMessages,
    createConversation,
    openConversation,
    sendMessage,
    sendTyping,
    sendReadReceipts,
    deleteMessage,
    toggleTranslation,
    disconnectWS,
  };
}

export default useMessaging;