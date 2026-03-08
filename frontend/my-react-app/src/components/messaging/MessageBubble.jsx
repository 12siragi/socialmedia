// src/components/messaging/MessageBubble.jsx
import React, { useState, useRef, useEffect } from "react";

// =============================================================================
// TRUTH LAYER 2: Render message based on truths
// isOwn = True  → right-aligned blue bubble
// isOwn = False → left-aligned grey bubble
// is_deleted = True → show "Deleted message" placeholder
// is_optimistic = True → sending (clock icon, faded)
// send_failed = True → failed (red warning icon)
// message_type != text → show media
// audio = null → show "Play audio" button (receivers only)
// audio.loading = True → generating…
// audio.audio_generated = True → show player
// audio.audio_failed = True → show retry
// =============================================================================

// ── AudioPlayer ───────────────────────────────────────────────────────────────
function AudioPlayer({ message, onRequestAudio }) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef                = useRef(null);
  const audio                   = message.audio;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime   = () => setProgress(el.currentTime);
    const onLoaded = () => setDuration(el.duration);
    const onEnded  = () => { setPlaying(false); setProgress(0); };
    el.addEventListener("timeupdate",     onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("ended",          onEnded);
    return () => {
      el.removeEventListener("timeupdate",     onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("ended",          onEnded);
    };
  }, [audio?.audio_url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  const seek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const pct = duration ? (progress / duration) * 100 : 0;

  // Not yet requested
  if (!audio) {
    return (
      <button className="audio-request-btn" onClick={onRequestAudio}>
        <i className="bi bi-volume-up me-1" />
        Play audio
      </button>
    );
  }

  // Generating
  if (audio.loading) {
    return (
      <div className="audio-player loading">
        <i className="bi bi-hourglass-split me-1" />
        Generating audio…
      </div>
    );
  }

  // Failed
  if (audio.audio_failed) {
    return (
      <div className="audio-player failed">
        <i className="bi bi-exclamation-circle me-1" />
        Audio unavailable
        <button className="audio-retry-btn" onClick={onRequestAudio}>Retry</button>
      </div>
    );
  }

  // Ready
  if (audio.audio_generated && audio.audio_url) {
    return (
      <div className="audio-player">
        <button className="audio-play-btn" onClick={togglePlay}>
          <i className={`bi ${playing ? "bi-pause-fill" : "bi-play-fill"}`} />
        </button>
        <div className="audio-progress-track" onClick={seek}>
          <div className="audio-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="audio-time">{fmt(progress)} / {fmt(duration)}</span>
        <audio ref={audioRef} src={audio.audio_url} preload="metadata" />
      </div>
    );
  }

  return null;
}

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({ message, isOwn, displayContent, showAvatar, currentUser, onReply, onDelete, onRequestAudio }) {
  const [showActions, setShowActions] = useState(false);

  const getAvatar = () => {
    const url = message.sender?.avatar_url || "";
    if (url.startsWith("http")) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.full_name || "U")}&background=7c3aed&color=fff&bold=true`;
  };

  const getTimeStr = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isReadByOthers = (message.read_by ?? []).some(r => r.user?.id !== currentUser?.id);

  return (
    <div
      className={`message-row ${isOwn ? "own" : "other"}${message.is_optimistic ? " optimistic" : ""}${message.send_failed ? " failed" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar column */}
      {!isOwn && (
        <div className="message-avatar-col">
          {showAvatar ? (
            <img src={getAvatar()} alt="" className="message-avatar" />
          ) : (
            <div className="message-avatar-spacer" />
          )}
        </div>
      )}

      <div className="message-col">
        {/* Sender name for group chats */}
        {!isOwn && showAvatar && (
          <div className="message-sender-name">{message.sender?.full_name}</div>
        )}

        {/* Reply preview */}
        {message.reply_to_preview && (
          <div className="message-reply-preview">
            <span className="reply-sender">{message.reply_to_preview.sender}</span>
            <span className="reply-content">{message.reply_to_preview.content}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`message-bubble ${isOwn ? "own" : "other"}`}>
          {message.is_deleted ? (
            <span className="deleted-message">
              <i className="bi bi-slash-circle me-1" />
              Message deleted
            </span>
          ) : (
            <>
              {message.message_type === "image" && message.media_url && (
                <img src={message.media_url} alt="Media" className="message-media-img" />
              )}
              {message.message_type === "video" && message.media_url && (
                <video src={message.media_url} controls className="message-media-video" />
              )}
              {message.message_type === "file" && message.media_url && (
                <a href={message.media_url} target="_blank" rel="noreferrer" className="message-file-link">
                  <i className="bi bi-file-earmark me-1" />
                  Download file
                </a>
              )}
              {(displayContent || message.content) && (
                <p className="message-text">{displayContent || message.content}</p>
              )}
            </>
          )}
        </div>

        {/* Audio player — receivers only, not deleted, not optimistic */}
        {!isOwn && !message.is_deleted && !message.is_optimistic && (
          <AudioPlayer message={message} onRequestAudio={onRequestAudio} />
        )}

        {/* Meta row */}
        <div className={`message-meta ${isOwn ? "justify-content-end" : ""}`}>
          <span className="message-time">{getTimeStr(message.created_at)}</span>

          {isOwn && message.is_optimistic && !message.send_failed && (
            <span className="read-tick" title="Sending…">
              <i className="bi bi-clock" />
            </span>
          )}
          {isOwn && message.send_failed && (
            <span className="read-tick failed" title="Failed to send">
              <i className="bi bi-exclamation-circle" />
            </span>
          )}
          {isOwn && !message.is_optimistic && !message.send_failed && (
            <span className={`read-tick ${isReadByOthers ? "read" : ""}`}>
              <i className={`bi ${isReadByOthers ? "bi-check2-all" : "bi-check2"}`} />
            </span>
          )}
        </div>
      </div>

      {/* Actions — hide while sending */}
      {showActions && !message.is_deleted && !message.is_optimistic && (
        <div className={`message-actions ${isOwn ? "left" : "right"}`}>
          <button className="msg-action-btn" onClick={onReply} title="Reply">
            <i className="bi bi-reply" />
          </button>
          {isOwn && (
            <button className="msg-action-btn danger" onClick={onDelete} title="Delete">
              <i className="bi bi-trash" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;