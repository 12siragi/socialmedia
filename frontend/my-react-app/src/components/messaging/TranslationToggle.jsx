// components/messaging/TranslationToggle.jsx
import React, { useState } from "react";

export default function TranslationToggle({ conversation, onToggle }) {
  const [loading, setLoading] = useState(false);
  const enabled = conversation?.translation_enabled ?? true;

  const handleToggle = async () => {
    if (loading || !conversation) return;
    setLoading(true);
    try {
      await onToggle(conversation.id, !enabled);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={enabled ? "Translation on — click to turn off" : "Translation off — click to turn on"}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: enabled ? "rgba(59,130,246,0.12)" : "transparent",
        border: `1px solid ${enabled ? "#3b82f6" : "#2a2a3e"}`,
        borderRadius: 8, padding: "5px 10px",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        fontFamily: "'DM Sans', sans-serif",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 14 }}>🌐</span>
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: enabled ? "#3b82f6" : "#555",
      }}>
        {loading ? "…" : enabled ? "Auto-translate ON" : "Auto-translate OFF"}
      </span>

      {/* Toggle pill */}
      <div style={{
        width: 28, height: 16, borderRadius: 8,
        background: enabled ? "#3b82f6" : "#2a2a3e",
        position: "relative", transition: "background 0.2s",
      }}>
        <div style={{
          position: "absolute", top: 2,
          left: enabled ? 14 : 2,
          width: 12, height: 12, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
        }} />
      </div>
    </button>
  );
}