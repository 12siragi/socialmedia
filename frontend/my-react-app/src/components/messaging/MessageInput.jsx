// components/messaging/MessageInput.jsx
import React, { useState, useRef, useCallback } from "react";

export default function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
}) {
  const [content, setContent]   = useState("");
  const [media, setMedia]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [sending, setSending]   = useState(false);
  const fileRef                 = useRef(null);
  const textareaRef             = useRef(null);

  const handleChange = (e) => {
    setContent(e.target.value);
    onTyping?.(true);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = useCallback(async () => {
    if ((!content.trim() && !media) || sending || disabled) return;
    setSending(true);
    try {
      await onSend({ content: content.trim(), media, replyTo: replyTo?.id });
      setContent("");
      removeMedia();
      onCancelReply?.();
      onTyping?.(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  }, [content, media, replyTo, sending, disabled, onSend, onCancelReply, onTyping]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      borderTop: "1px solid #1e1e2e",
      background: "#0f0f13",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Reply preview */}
      {replyTo && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 16px", background: "#141420",
          borderLeft: "3px solid #3b82f6",
        }}>
          <div>
            <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>
              Replying to {replyTo.sender?.full_name}
            </span>
            <div style={{
              fontSize: 12, color: "#666", marginTop: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: 240,
            }}>
              {replyTo.content || "Media"}
            </div>
          </div>
          <button onClick={onCancelReply} style={{
            background: "none", border: "none", color: "#555",
            cursor: "pointer", fontSize: 16, padding: 4,
          }}>×</button>
        </div>
      )}

      {/* Media preview */}
      {media && (
        <div style={{
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
          background: "#141420",
        }}>
          {preview
            ? <img src={preview} alt="" style={{ height: 48, borderRadius: 6, objectFit: "cover" }} />
            : <div style={{ fontSize: 24 }}>📎</div>
          }
          <span style={{ fontSize: 12, color: "#888", flex: 1 }}>{media.name}</span>
          <button onClick={removeMedia} style={{
            background: "none", border: "none", color: "#ef4444",
            cursor: "pointer", fontSize: 16,
          }}>×</button>
        </div>
      )}

      {/* Input row */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 8,
        padding: "10px 12px",
      }}>
        {/* Attach */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          style={{
            background: "none", border: "1px solid #2a2a3e",
            borderRadius: 8, width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#555", fontSize: 16, flexShrink: 0,
          }}
        >📎</button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1, background: "#1a1a2e", border: "1px solid #2a2a3e",
            borderRadius: 12, padding: "8px 14px",
            color: "#e8e8f0", fontSize: 14, resize: "none",
            outline: "none", lineHeight: 1.5, maxHeight: 120,
            fontFamily: "'DM Sans', sans-serif",
            overflowY: "auto",
          }}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={(!content.trim() && !media) || sending || disabled}
          style={{
            background: (!content.trim() && !media) || sending || disabled
              ? "#1e1e2e" : "#3b82f6",
            border: "none", borderRadius: 10,
            width: 36, height: 36, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: ((!content.trim() && !media) || sending || disabled) ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            fontSize: 16,
          }}
        >
          {sending ? "…" : "➤"}
        </button>
      </div>
    </div>
  );
}