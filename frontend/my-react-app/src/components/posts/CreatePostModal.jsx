// src/components/posts/CreatePostModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Button, Alert, Image } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import useUserActions from '../../hooks/user.actions';
import '../css/CreatePostModal.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;

function CreatePostModal({ show, onClose, onSuccess }) {
  const { user } = useAuth();
  const { createPost, getAccountSettings } = useUserActions();

  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show && user) loadUserAvatar();
  }, [show, user?.id]);

  useEffect(() => {
    const handleAvatarUpdate = () => loadUserAvatar();
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [user]);

  const loadUserAvatar = async () => {
    try {
      const settings = await getAccountSettings();
      const rawUrl = settings?.avatar_url || settings?.avatar || '';
      if (!rawUrl) return;
      if (rawUrl.startsWith('http')) {
        setCurrentUserAvatar(rawUrl);
      } else {
        setCurrentUserAvatar(`${BACKEND_URL}${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`);
      }
    } catch (error) {
      console.error('Failed to load user avatar:', error);
    }
  };

  const getUserAvatar = () => {
    if (currentUserAvatar) return currentUserAvatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=8b5cf6&color=fff&bold=true`;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + mediaFiles.length > 10) {
      setError('Maximum 10 files allowed');
      return;
    }

    const invalidFiles = files.filter(file => file.size > 100 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Some files exceed 100MB limit');
      return;
    }

    setMediaFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, {
          file,
          url: reader.result,
          type: file.type.startsWith('image/') ? 'image' : 'video'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && mediaFiles.length === 0) {
      setError('Post must have content or media');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // createPost returns the new post object from backend
      const newPost = await createPost({
        content: content.trim(),
        media_files: mediaFiles
      });

      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);

      // ✅ Pass new post to onSuccess so Home can prepend it instantly
      if (onSuccess) onSuccess(newPost);
    } catch (err) {
      console.error('Create post error:', err);
      setError(err.response?.data?.detail || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setError(null);
    if (onClose) onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create Post</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* User info */}
          <div className="d-flex align-items-center mb-3">
            <Image
              src={getUserAvatar()}
              roundedCircle width={40} height={40}
              className="me-2"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=8b5cf6&color=fff&bold=true`;
              }}
            />
            <strong>{user?.full_name}</strong>
          </div>

          {/* Content */}
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          {/* Media previews */}
          {mediaPreviews.length > 0 && (
            <div className="media-previews mb-3">
              <div className="preview-grid">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="preview-item">
                    {preview.type === 'image' ? (
                      <img src={preview.url} alt={`Preview ${index + 1}`} />
                    ) : (
                      <video src={preview.url} />
                    )}
                    <button type="button" className="remove-btn" onClick={() => removeMedia(index)}>
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="d-flex justify-content-between align-items-center border-top pt-3">
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || mediaFiles.length >= 10}
              >
                <i className="bi bi-image me-1"></i>
                Photo/Video
              </Button>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || (!content.trim() && mediaFiles.length === 0)}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Posting...</>
              ) : 'Post'}
            </Button>
          </div>
        </Form>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Modal.Body>
    </Modal>
  );
}

export default CreatePostModal;