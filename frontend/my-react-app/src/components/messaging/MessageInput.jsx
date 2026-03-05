// src/components/messaging/MessageInput.jsx
import React, { useState, useRef } from "react";

// =============================================================================
// TRUTH LAYER 3: Form validation — send button disabled unless content = True
// TRUTH LAYER 4: Hooks — onTyping fires on input change
// =============================================================================

function MessageInput({ onSend, onTyping, wsConnected }) {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  // TRUTH GATE: canSend = True only if content or media exists
  const canSend = (content.trim().length > 0 || media !== null) && !sending;

  const handleContentChange = (e) => {
    setContent(e.target.value);
    // EFFECT CONNECTION: typing → notify others
    onTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMedia(file);
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview({
      url: reader.result,
      type: file.type.startsWith("image/") ? "image" : "video",
    });
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!canSend) return; // TRUTH GATE: block if False

    try {
      setSending(true);
      await onSend({ content: content.trim(), media });
      setContent("");
      setMedia(null);
      setMediaPreview(null);
      onTyping(false); // stop typing indicator
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-input-area">

      {/* Media preview */}
      {/* TRUTH GATE: mediaPreview = True → show preview */}
      {mediaPreview && (
        <div className="input-media-preview">
          {mediaPreview.type === "image" ? (
            <img src={mediaPreview.url} alt="Preview" />
          ) : (
            <video src={mediaPreview.url} />
          )}
          <button className="remove-media-btn" onClick={removeMedia}>
            <i className="bi bi-x-circle-fill" />
          </button>
        </div>
      )}

      <div className="message-input-row">
        {/* Media attach button */}
        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Attach file"
        >
          <i className="bi bi-paperclip" />
        </button>

        {/* Text input */}
        <textarea
          className="message-textarea"
          placeholder={wsConnected ? "Type a message..." : "Reconnecting..."}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
        />

        {/* TRUTH GATE: canSend = True → active send button */}
        <button
          className={`send-btn ${canSend ? "active" : ""}`}
          onClick={handleSend}
          disabled={!canSend}
          title="Send"
        >
          {sending ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            <i className="bi bi-send-fill" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
}

export default MessageInput;