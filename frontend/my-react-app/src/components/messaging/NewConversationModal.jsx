// src/components/messaging/NewConversationModal.jsx
import React, { useState } from "react";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import axiosService from "../helpers/axios";

// =============================================================================
// TRUTH LAYER 3: Form validation
// searchQuery = True → fetch users
// selectedUsers.length > 0 = True → can submit
// isGroup = True → name field required
// =============================================================================

function NewConversationModal({ show, onClose, onSubmit }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // TRUTH GATE: canSubmit = True only if users selected AND (not group OR has name)
  const canSubmit =
    selectedUsers.length > 0 &&
    (!isGroup || groupName.trim().length > 0) &&
    !submitting;

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axiosService.get(`/api/auth/users/search/?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data?.results || res.data || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const toggleUser = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) return prev.filter(u => u.id !== user.id); // remove
      // TRUTH GATE: DM = only 1 user; group = many
      if (!isGroup) return [user];
      return [...prev, user];
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        participantIds: selectedUsers.map(u => u.id),
        isGroup,
        name: groupName.trim(),
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create conversation.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAvatar = (user) => {
    if (user.avatar_url?.startsWith("http")) return user.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || "U")}&background=7c3aed&color=fff&bold=true`;
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>New Message</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

        {/* Group toggle */}
        <Form.Check
          type="switch"
          label="Create group chat"
          checked={isGroup}
          onChange={(e) => {
            setIsGroup(e.target.checked);
            if (!e.target.checked) setSelectedUsers(prev => prev.slice(0, 1));
          }}
          className="mb-3"
        />

        {/* TRUTH GATE: isGroup = True → show name field */}
        {isGroup && (
          <Form.Group className="mb-3">
            <Form.Control
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </Form.Group>
        )}

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="selected-users mb-3">
            {selectedUsers.map(u => (
              <span key={u.id} className="selected-user-chip">
                {u.full_name}
                <button onClick={() => toggleUser(u)}>
                  <i className="bi bi-x" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <Form.Control
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="mb-2"
        />

        {/* Search results */}
        {searching && <div className="text-center py-2"><Spinner size="sm" animation="border" /></div>}

        <div className="search-results">
          {searchResults.map(user => {
            const isSelected = selectedUsers.some(u => u.id === user.id); // True if selected
            return (
              <div
                key={user.id}
                className={`search-result-item ${isSelected ? "selected" : ""}`}
                onClick={() => toggleUser(user)}
              >
                <img src={getAvatar(user)} alt="" className="search-result-avatar" />
                <div>
                  <div className="search-result-name">{user.full_name}</div>
                  <div className="search-result-email text-muted small">{user.email}</div>
                </div>
                {/* TRUTH GATE: isSelected = True → checkmark */}
                {isSelected && <i className="bi bi-check-circle-fill text-primary ms-auto" />}
              </div>
            );
          })}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? <Spinner size="sm" animation="border" /> : "Start Chat"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NewConversationModal;