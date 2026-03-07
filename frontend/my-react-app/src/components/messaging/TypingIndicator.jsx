// components/messaging/TypingIndicator.jsx
import React from "react";

export default function TypingIndicator({ typingUsers = {} }) {
  const names = Object.values(typingUsers);
  if (names.length === 0) return null;

  const label = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing`
    : "Several people are typing";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "4px 20px 8px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Animated dots */}
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#3b82f6",
            animation: "typingBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: "#555", fontStyle: "italic" }}>
        {label}
      </span>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}