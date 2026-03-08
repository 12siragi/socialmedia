// components/messaging/MessageList.jsx
import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({
  messages,
  activeConversation,
  currentUser,
  onReply,
  onDelete,
  onRequestAudio,
}) {
  const getDisplayContent = (message) => {
    if (
      activeConversation?.translation_enabled &&
      message.translation &&
      message.translation.target_language === activeConversation.translation_target_language
    ) {
      return message.translation.translated_content;
    }
    return message.content;
  };

  const shouldShowAvatar = (msg, index) => {
    if (msg.is_deleted) return false;
    const prevMsg = messages[index - 1];
    return !prevMsg || prevMsg.sender.id !== msg.sender.id;
  };

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          displayContent={getDisplayContent(msg)}
          isOwn={msg.sender.id === currentUser.id}
          showAvatar={shouldShowAvatar(msg, index)}
          currentUser={currentUser}
          onReply={() => onReply(msg)}
          onDelete={() => onDelete(msg.id)}
          onRequestAudio={() => onRequestAudio?.(msg.id)}
        />
      ))}
    </div>
  );
}