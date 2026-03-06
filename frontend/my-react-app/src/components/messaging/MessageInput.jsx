// src/components/messaging/MessageInput.jsx
import React, { useState, useRef } from "react";

// =============================================================================
// TRUTH LAYER 1: State
// translateMode = True  → user wants to preview translation before sending
// translateMode = False → send as-is (default)
// translating   = True  → waiting for translation API (show spinner)
// previewText   = null  → no preview yet
// previewText   = str   → translated preview ready (user can edit)
//
// TRUTH LAYER 3: Form validation
// canSend = (content.trim() || media) && !sending && !translating
//
// CONNECTIONS:
// onTranslate  → owned by useMessaging hook (NOT axiosService here)
// onSend       → owned by useMessaging hook
// onTyping     → owned by useMessaging hook
//
// TRUTH GATE for send:
// translateMode=True && previewText=True  → send previewText
// translateMode=True && previewText=False → send original (preview failed)
// translateMode=False                     → send original
// =============================================================================

function MessageInput({
  onSend,
  onTyping,
  wsConnected,
  onTranslate,           // (text, targetLang) => Promise<string|null> — from useMessaging
  receiverLanguage = "ar", // target language for translation
}) {
  const [content, setContent]           = useState("");
  const [media, setMedia]               = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [sending, setSending]           = useState(false);

  // ── Translation state ────────────────────────────────────────────
  const [translateMode, setTranslateMode]   = useState(false); // False = off
  const [translating, setTranslating]       = useState(false); // True = API in progress
  const [previewText, setPreviewText]       = useState(null);  // null = no preview
  const [translateError, setTranslateError] = useState(null);
  // ─────────────────────────────────────────────────────────────────

  const fileInputRef = useRef(null);

  // TRUTH GATE: canSend = True only if content or media AND not busy
  const canSend = (content.trim().length > 0 || media !== null) && !sending && !translating;

  // ── Translation toggle ───────────────────────────────────────────
  // TRUTH GATE:
  // turning ON + content exists → fetch preview immediately
  // turning ON + no content     → show empty preview area
  // turning OFF                 → clear preview state
  const handleToggleTranslate = async () => {
    const turningOn = !translateMode;
    setTranslateMode(turningOn);
    setTranslateError(null);

    if (!turningOn) {
      setPreviewText(null); // False → clear
      return;
    }

    if (content.trim()) {
      await fetchPreview(content.trim());
    }
  };

  // ── Fetch preview ────────────────────────────────────────────────
  // TRUTH GATE:
  // onTranslate returns string = True  → previewText = translated
  // onTranslate returns null   = False → translateError shown
  const fetchPreview = async (text) => {
    if (!text.trim() || !onTranslate) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const translated = await onTranslate(text, receiverLanguage);
      if (translated) {
        setPreviewText(translated);   // True → preview ready
      } else {
        setTranslateError("Translation failed. Will send as original.");
        setPreviewText(null);         // False → no preview
      }
    } finally {
      setTranslating(false);
    }
  };

  // ── Content change ───────────────────────────────────────────────
  const handleContentChange = (e) => {
    setContent(e.target.value);
    onTyping(e.target.value.length > 0);
    // TRUTH GATE: translateMode = True → stale preview → clear
    if (translateMode) {
      setPreviewText(null);
      setTranslateError(null);
    }
  };

  // When user stops typing and translateMode is on → fetch preview
  const handleContentBlur = async () => {
    if (translateMode && content.trim() && !previewText && !translating) {
      await fetchPreview(content.trim());
    }
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
    if (!canSend) return;

    // TRUTH GATE:
    // translateMode=True && previewText=True  → send translation
    // translateMode=True && previewText=False → send original (fallback)
    // translateMode=False                     → send original
    const contentToSend = (translateMode && previewText)
      ? previewText
      : content.trim();

    try {
      setSending(true);
      await onSend({ content: contentToSend, media });
      // Reset after send
      setContent("");
      setMedia(null);
      setMediaPreview(null);
      setPreviewText(null);
      setTranslateError(null);
      onTyping(false);
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-input-area">

      {/* ── Translate toggle bar ──────────────────────────────────── */}
      {/* Only show if onTranslate is available (hook connected)      */}
      {onTranslate && (
        <div className="translate-toggle-bar">
          <button
            className={`translate-toggle-btn ${translateMode ? "active" : ""}`}
            onClick={handleToggleTranslate}
            disabled={sending}
            title={translateMode ? "Turn off translation" : "Translate before sending"}
          >
            <i className="bi bi-translate me-1" />
            {translateMode ? "Translation ON" : "Translate before sending"}
            {translateMode && (
              <span className="translate-target-badge">
                → {receiverLanguage.toUpperCase()}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Translation preview ───────────────────────────────────── */}
      {/* TRUTH GATE: translateMode=True → show preview area          */}
      {translateMode && (
        <div className="translate-preview-area">
          <div className="translate-preview-label">
            <i className="bi bi-eye me-1" />
            Preview (what receiver sees) — you can edit:
          </div>

          {translating ? (
            <div className="translate-preview-loading">
              <span className="spinner-border spinner-border-sm me-2" />
              Translating...
            </div>
          ) : translateError ? (
            <div className="translate-preview-error">
              <i className="bi bi-exclamation-triangle me-1" />
              {translateError}
            </div>
          ) : previewText !== null ? (
            <textarea
              className="translate-preview-input"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              rows={2}
              placeholder="Translation preview..."
              dir="auto"
            />
          ) : (
            <div className="translate-preview-empty">
              Type your message above to see translation preview
            </div>
          )}
        </div>
      )}

      {/* Media preview */}
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
        {/* Attach */}
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
          onBlur={handleContentBlur}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
          dir="auto"
        />

        {/* Refresh preview button */}
        {translateMode && content.trim() && !translating && (
          <button
            className="preview-btn"
            onClick={() => fetchPreview(content.trim())}
            title="Refresh translation"
            disabled={sending}
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        )}

        {/* Send button */}
        <button
          className={`send-btn ${canSend ? "active" : ""}`}
          onClick={handleSend}
          disabled={!canSend}
          title={translateMode && previewText ? "Send translated" : "Send"}
        >
          {sending ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            <i className={`bi ${translateMode && previewText ? "bi-translate" : "bi-send-fill"}`} />
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