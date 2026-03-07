// src/pages/Messages.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/contexts/AuthContext";
import Layout from "../components/Layout";
import useMessaging from "../hooks/useMessaging";
import ConversationList from "../components/messaging/ConversationList";
import ChatWindow from "../components/messaging/ChatWindow";
import NewConversationModal from "../components/messaging/NewConversationModal";
import "../components/css/Messages.css";

function Messages() {
  const { user } = useAuth();
  const [showNewModal, setShowNewModal] = useState(false);

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
    createConversation,
    openConversation,
    sendMessage,
    sendTyping,
    sendReadReceipts,
    loadMoreMessages,
    deleteMessage,
    toggleTranslation,
    disconnectWS,
  } = useMessaging();

  useEffect(() => {
    loadConversations();
    return () => disconnectWS();
  }, []);

  const handleNewConversation = async ({ participantIds, isGroup, name }) => {
    const conv = await createConversation({ participantIds, isGroup, name });
    setShowNewModal(false);
    openConversation(conv);
  };

  return (
    <Layout>
      <div className="messages-page">
        <div className="messages-sidebar">
          <div className="messages-sidebar-header">
            <h5 className="mb-0">Messages</h5>
            <button
              className="new-chat-btn"
              onClick={() => setShowNewModal(true)}
              title="New conversation"
            >
              <i className="bi bi-pencil-square" />
            </button>
          </div>

          {error && <div className="messages-error">{error}</div>}

          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id}
            loading={loadingConversations}
            currentUser={user}
            onlineUsers={onlineUsers}
            onSelect={openConversation}
          />
        </div>

        <div className="messages-main">
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              wsConnected={wsConnected}
              loadingMessages={loadingMessages}
              hasMoreMessages={hasMoreMessages}
              typingUsers={typingUsers}
              onlineUsers={onlineUsers}
              currentUser={user}
              onSendMessage={sendMessage}
              onTyping={sendTyping}
              onReadReceipts={sendReadReceipts}
              onLoadMore={() => loadMoreMessages(activeConversation.id)}
              onDeleteMessage={deleteMessage}
              onToggleTranslation={toggleTranslation}
            />
          ) : (
            <div className="messages-empty">
              <i className="bi bi-chat-dots display-1 text-muted" />
              <h5 className="mt-3 text-muted">Select a conversation</h5>
              <p className="text-muted">Or start a new one</p>
              <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
                <i className="bi bi-plus-circle me-2" />
                New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewConversationModal
          show={showNewModal}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleNewConversation}
        />
      )}
    </Layout>
  );
}

export default Messages;