// components/messaging/TranslationToggle.jsx
import React, { useState, useEffect, useRef } from "react";

const LANGUAGES = [
  { code: "ar", name: "Arabic" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "tr", name: "Turkish" },
  { code: "ur", name: "Urdu" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
  { code: "en", name: "English" },
];

export default function TranslationToggle({ conversation, onToggle }) {
  const [enabled, setEnabled]       = useState(false);
  const [selectedLang, setSelectedLang] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const loadingRef                  = useRef(false);

  useEffect(() => {
    if (conversation) {
      setEnabled(conversation.translation_enabled || false);
      setSelectedLang(conversation.translation_target_language || "");
    }
  }, [conversation?.id, conversation?.translation_enabled, conversation?.translation_target_language]);

  const handleToggle = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      if (enabled) {
        await onToggle(conversation.id, false, null);
        setEnabled(false);
        setSelectedLang("");
      } else {
        if (!selectedLang) {
          setError("Select a language first.");
          return;
        }
        await onToggle(conversation.id, true, selectedLang);
        setEnabled(true);
      }
    } catch (err) {
      setError("Failed to update translation.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleLangChange = async (e) => {
    const lang = e.target.value;
    setSelectedLang(lang);
    if (enabled && lang) {
      loadingRef.current = true;
      setLoading(true);
      try {
        await onToggle(conversation.id, true, lang);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  };

  return (
    <div className="translation-toggle">
      <select
        value={selectedLang}
        onChange={handleLangChange}
        disabled={loading}
      >
        <option value="">Language</option>
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.name}</option>
        ))}
      </select>

      <button
        className={`translation-toggle-btn ${enabled ? "enabled" : ""}`}
        onClick={handleToggle}
        disabled={loading}
      >
        🌐 {loading ? "…" : enabled ? "Translating to " + (LANGUAGES.find(l => l.code === selectedLang)?.name || selectedLang) : "Translate"}
      </button>

      {error && <span className="translation-error">{error}</span>}
    </div>
  );
}