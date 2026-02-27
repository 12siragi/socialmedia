// src/components/posts/PostCard.jsx
import React, { useState } from 'react';
import { Card, Image, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useUserActions from '../../hooks/user.actions';
import { useAuth } from '../contexts/AuthContext';
import '../css/PostCard.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';

function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const { toggleLike, toggleBookmark, deletePost } = useUserActions();

  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked || false);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAuthor = user?.id === post.author?.id;

  // ✅ FIXED: No more API call per card — just use avatar_url from post data
  const getAvatarUrl = (author) => {
    if (!author) {
      return `https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff&bold=true`;
    }

    if (author.avatar_url) {
      // Already absolute URL from backend (https fixed via settings.py)
      if (author.avatar_url.startsWith('http')) {
        return author.avatar_url;
      }
      // Relative URL fallback
      const path = author.avatar_url.startsWith('/') ? author.avatar_url : `/${author.avatar_url}`;
      return `${BACKEND_URL}${path}`;
    }

    const name = author.full_name || author.first_name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&bold=true`;
  };

  const getMediaUrl = (media) => {
    if (!media) return '';
    const mediaUrl = media.image_url || media.video_url || media.thumbnail_url;
    if (!mediaUrl) return '';
    if (mediaUrl.startsWith('http')) return mediaUrl;
    const path = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
    return `${BACKEND_URL}${path}`;
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Date(date).toLocaleDateString();
  };

  const handleLike = async () => {
    try {
      setLoading(true);
      const result = await toggleLike(post.id);
      setLiked(result.liked);
      setLikesCount(result.likes_count);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      setLoading(true);
      const result = await toggleBookmark(post.id);
      setBookmarked(result.bookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(post.id);
      if (onDelete) onDelete(post.id);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  return (
    <Card className="post-card mb-3">
      <Card.Body>
        {/* Header */}
        <div className="post-header d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center">
            <Link to={`/profile/${post.author?.id}/`} className="text-decoration-none">
              <Image
                src={getAvatarUrl(post.author)}
                roundedCircle
                width={40}
                height={40}
                className="me-2"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.full_name || 'User')}&background=8b5cf6&color=fff&bold=true`;
                }}
              />
            </Link>
            <div>
              <Link to={`/profile/${post.author?.id}/`} className="text-decoration-none">
                <strong className="author-name">{post.author?.full_name || 'Unknown User'}</strong>
              </Link>
              <div className="post-time text-muted small">{getTimeAgo(post.created_at)}</div>
            </div>
          </div>

          {isAuthor && (
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="text-muted p-0 border-0">
                <i className="bi bi-three-dots"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => onUpdate && onUpdate(post)}>
                  <i className="bi bi-pencil me-2"></i>Edit
                </Dropdown.Item>
                <Dropdown.Item onClick={handleDelete} className="text-danger">
                  <i className="bi bi-trash me-2"></i>Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>

        {/* Content */}
        {post.content && post.content.trim() && (
          <div className="post-content mb-3">
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="post-media mb-3">
            {post.media.length === 1 ? (
              <div className="media-single">
                {post.media[0].media_type === 'image' ? (
                  <img
                    src={getMediaUrl(post.media[0])}
                    alt="Post media"
                    className="img-fluid rounded"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <video
                    src={getMediaUrl(post.media[0])}
                    controls
                    className="w-100 rounded"
                  />
                )}
              </div>
            ) : (
              <div className={`media-grid media-grid-${Math.min(post.media.length, 4)}`}>
                {post.media.slice(0, 4).map((media, index) => (
                  <div key={media.id} className="media-item">
                    {media.media_type === 'image' ? (
                      <img
                        src={getMediaUrl(media)}
                        alt={`Media ${index + 1}`}
                        className="img-fluid"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <video src={getMediaUrl(media)} className="w-100" />
                    )}
                    {index === 3 && post.media.length > 4 && (
                      <div className="media-overlay">+{post.media.length - 4}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="post-actions d-flex justify-content-between align-items-center">
          <div className="d-flex gap-3">
            <Button variant="link" className={`action-btn ${liked ? 'active' : ''}`} onClick={handleLike} disabled={loading}>
              <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
              <span className="ms-1">{likesCount}</span>
            </Button>
            <Button variant="link" className="action-btn" onClick={() => setShowComments(!showComments)}>
              <i className="bi bi-chat"></i>
              <span className="ms-1">{post.comments_count || 0}</span>
            </Button>
            <Button variant="link" className="action-btn">
              <i className="bi bi-share"></i>
            </Button>
          </div>
          <Button variant="link" className={`action-btn ${bookmarked ? 'active' : ''}`} onClick={handleBookmark} disabled={loading}>
            <i className={`bi ${bookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
          </Button>
        </div>

        {/* Comments Preview */}
        {post.comments_preview && post.comments_preview.length > 0 && (
          <div className="comments-preview mt-3">
            {post.comments_preview.slice(0, 2).map((comment) => (
              <div key={comment.id} className="comment-item mb-2">
                <strong>{comment.author?.full_name || 'Unknown'}</strong>{' '}
                <span>{comment.content}</span>
              </div>
            ))}
            {post.comments_count > 2 && (
              <Link to={`/posts/${post.id}/`} className="view-all-comments">
                View all {post.comments_count} comments
              </Link>
            )}
          </div>
        )}

        {/* Comment Input */}
        {showComments && (
          <div className="comment-input mt-3">
            <div className="d-flex gap-2">
              <Image
                src={getAvatarUrl(user)}
                roundedCircle
                width={32}
                height={32}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=8b5cf6&color=fff&bold=true`;
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Add a comment..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    console.log('Add comment:', e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default PostCard;